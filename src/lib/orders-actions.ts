"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  OrderStatus,
  PaymentMethod,
  ShippingMethod,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { siteConfig } from "@/lib/site-config";
import { processPayment } from "@/lib/payment/mock-payment";
import { validateCoupon } from "@/lib/coupons";
import { sendEmail } from "@/lib/email/client";
import {
  orderConfirmationEmail,
  adminNewOrderEmail,
} from "@/lib/email/templates";
import { markCartRecovered } from "@/lib/abandoned-cart-actions";

// ---------- schemas ----------

const itemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  price: z.coerce.number().int().min(0),
  image: z.string(),
  size: z.string().nullable(),
  qty: z.coerce.number().int().min(1),
});

const customerSchema = z.object({
  fullName: z.string().min(1, "שם מלא חובה"),
  email: z.string().email("אימייל לא תקין"),
  phone: z.string().min(1, "טלפון חובה"),
});

const shippingSchema = z.object({
  method: z.enum(ShippingMethod),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  zip: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const paymentSchema = z.object({
  method: z.enum(PaymentMethod),
  cardNumber: z.string().nullable().optional(),
});

const placeOrderSchema = z.object({
  customer: customerSchema,
  shipping: shippingSchema,
  payment: paymentSchema,
  items: z.array(itemSchema).min(1, "העגלה ריקה"),
  couponCode: z.string().nullable().optional(),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

export type PlaceOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

// ---------- helpers ----------

function generateOrderId() {
  return "JC-" + Date.now().toString(36).toUpperCase();
}

function computeShippingCost(method: ShippingMethod, subtotal: number) {
  if (method === "pickup") return 0;
  if (method === "express") return 35;
  // standard
  return subtotal >= siteConfig.shop.freeShippingMin ? 0 : 30;
}

// ---------- public action ----------

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "הנתונים לא תקינים",
    };
  }

  const { customer, shipping, payment, items, couponCode } = parsed.data;
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shippingCost = computeShippingCost(shipping.method, subtotal);

  // ---------- Coupon validation ----------
  let discount = 0;
  let couponId: string | null = null;
  let appliedCouponCode: string | null = null;
  if (couponCode) {
    const validation = await validateCoupon(couponCode, subtotal);
    if (!validation.ok) {
      return { ok: false, error: validation.error };
    }
    discount = validation.applied.discount;
    couponId = validation.applied.couponId;
    appliedCouponCode = validation.applied.code;
  }

  const total = Math.max(0, subtotal - discount) + shippingCost;

  const me = await getCurrentUser();

  // Verify all product ids exist and are active (cheap defense against tampering)
  const dbProducts = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.id) }, isActive: true },
    select: { id: true, price: true },
  });
  if (dbProducts.length !== new Set(items.map((i) => i.id)).size) {
    return { ok: false, error: "אחד המוצרים בעגלה אינו זמין" };
  }

  // ---------- Payment ----------
  // In TEST mode this is a simulated processor (see lib/payment/mock-payment.ts).
  // When real Tranzila is wired, swap that module.
  const paymentResult = await processPayment({
    method: payment.method,
    amount: total,
    cardNumber: payment.cardNumber ?? undefined,
  });

  if (!paymentResult.ok) {
    return { ok: false, error: paymentResult.error };
  }

  // ---------- Persist order (+ increment coupon usage atomically) ----------
  const orderId = generateOrderId();
  try {
    await prisma.$transaction(async (tx) => {
      await tx.order.create({
        data: {
          id: orderId,
          userId: me?.id ?? null,
          status: OrderStatus.new,
          customerFullName: customer.fullName,
          customerEmail: customer.email,
          customerPhone: customer.phone,
          shippingMethod: shipping.method,
          shippingAddress: shipping.address ?? null,
          shippingCity: shipping.city ?? null,
          shippingZip: shipping.zip ?? null,
          shippingNotes: shipping.notes ?? null,
          shippingCost,
          paymentMethod: payment.method,
          paymentLast4: paymentResult.last4,
          paymentReference: paymentResult.reference,
          subtotal,
          discount,
          couponId,
          couponCode: appliedCouponCode,
          total,
          items: {
            create: items.map((i, idx) => ({
              productId: i.id,
              name: i.name,
              image: i.image,
              size: i.size,
              price: i.price,
              qty: i.qty,
              position: idx,
            })),
          },
        },
      });

      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { uses: { increment: 1 } },
        });
      }
    });
  } catch (err) {
    console.error("[placeOrder] failed:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "שמירת ההזמנה נכשלה",
    };
  }

  revalidatePath("/admin/orders");
  revalidatePath("/account");

  // ---------- Mark any abandoned cart for this email as recovered ----------
  after(async () => {
    try {
      await markCartRecovered(customer.email);
    } catch (err) {
      console.error("[placeOrder] markCartRecovered failed:", err);
    }
  });

  // ---------- Send transactional emails (after response, non-blocking) ----------
  after(async () => {
    try {
      const created = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      if (!created) return;

      // Customer confirmation
      const customerTpl = orderConfirmationEmail(created);
      await sendEmail({
        to: created.customerEmail,
        subject: customerTpl.subject,
        html: customerTpl.html,
      });

      // Admin notification
      const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL ?? siteConfig.contact.email;
      const adminTpl = adminNewOrderEmail(created);
      await sendEmail({
        to: adminEmail,
        subject: adminTpl.subject,
        html: adminTpl.html,
        replyTo: created.customerEmail,
      });
    } catch (err) {
      console.error("[placeOrder] email send failed:", err);
    }
  });

  return { ok: true, orderId };
}

// ---------- coupon validation (client-callable) ----------

export async function validateCouponForCart(
  code: string,
  subtotal: number,
) {
  return validateCoupon(code, subtotal);
}

// ---------- read for confirmation page ----------

export async function getOrderForCustomer(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { orderBy: { position: "asc" } } },
  });
}
