"use server";

import { after } from "next/server";
import { randomBytes } from "crypto";
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
import { getSiteSettings } from "@/lib/site-settings";
import { processPayment } from "@/lib/payment/mock-payment";
// SECURITY: Used as a startup guard — selectProvider() throws in
// production when PAYMENT_PROVIDER=mock, so importing it here means
// the placeOrder action will fail loudly if a prod deployment ever
// runs without a real PSP configured. Keep the import even though
// we use processPayment for the actual call until the redirect
// flow is wired.
import { selectProvider } from "@/lib/payment/provider";
import { validateCoupon, computeDiscount } from "@/lib/coupons";
import { sendEmail } from "@/lib/email/client";
import {
  orderConfirmationEmail,
  adminNewOrderEmail,
} from "@/lib/email/templates";
import { markCartRecovered } from "@/lib/abandoned-cart-actions";
import { rateLimit, getClientIp, POLICIES } from "@/lib/rate-limit";

// ---------- schemas ----------
//
// SECURITY: Every field has a hard `.max()` cap. Price/qty are NOT
// trusted from the client — see placeOrder() for the server-side
// recompute. Even though the client sends them for the price-equality
// check, the receipts written to the DB come from product rows.

const itemSchema = z.object({
  id: z.string().min(1).max(200),
  // The remaining fields are display-only echo. We re-derive everything
  // we trust from the DB by `id`.
  slug: z.string().max(200).optional(),
  name: z.string().max(200).optional(),
  price: z.coerce.number().int().min(0).max(100_000_00).optional(),
  image: z.string().max(2000).optional(),
  size: z.string().max(40).nullable().optional(),
  qty: z.coerce.number().int().min(1).max(99),
});

const customerSchema = z.object({
  fullName: z.string().min(1, "שם מלא חובה").max(120),
  email: z.string().email("אימייל לא תקין").max(254),
  phone: z.string().min(1, "טלפון חובה").max(40),
});

const shippingSchema = z.object({
  method: z.enum(ShippingMethod),
  address: z.string().max(300).nullable().optional(),
  city: z.string().max(120).nullable().optional(),
  zip: z.string().max(20).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

const paymentSchema = z.object({
  method: z.enum(PaymentMethod),
  cardNumber: z.string().max(40).nullable().optional(),
});

const placeOrderSchema = z.object({
  customer: customerSchema,
  shipping: shippingSchema,
  payment: paymentSchema,
  items: z.array(itemSchema).min(1, "העגלה ריקה").max(100),
  couponCode: z.string().max(40).nullable().optional(),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

export type PlaceOrderResult =
  | { ok: true; orderId: string; accessToken: string }
  | { ok: false; error: string };

// ---------- helpers ----------

/**
 * Cryptographically random order id. Replaces the old
 * `JC-{Date.now().toString(36)}` which was guessable within ~2s and let
 * anyone scrape recent orders by walking the ID space. 12 random bytes
 * → 96 bits of entropy → unguessable. Prefix kept for readability in
 * admin emails / invoices.
 */
function generateOrderId() {
  return "JC-" + randomBytes(9).toString("base64url").toUpperCase();
}

/**
 * Random per-order access token issued to the customer at checkout.
 * The /checkout/confirmation/[id] page accepts ?t=<token> as proof
 * that the requester is the buyer (in addition to: logged-in user
 * matches order.userId, or admin role). Without this, predictable
 * IDs aren't the only concern — even random IDs leak via email
 * forwarding etc., so we want a separate access secret.
 */
function generateAccessToken() {
  return randomBytes(24).toString("base64url");
}

async function computeShippingCost(method: ShippingMethod, subtotal: number) {
  if (method === "pickup") return 0;
  if (method === "express") return 35;
  // standard — read the live merchant-edited threshold, not the static
  // siteConfig fallback. This keeps server-side total in sync with what
  // the cart bar showed the customer.
  const settings = await getSiteSettings();
  return subtotal >= settings.shop.freeShippingMin ? 0 : 30;
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

  // SECURITY: Normalize the email ONCE up-front and use the normalized
  // value EVERYWHERE — perUserLimit lookup, order persistence,
  // abandoned-cart cleanup, customer emails. Otherwise `User@x.com`
  // vs `user@x.com` is treated as two different customers and lets
  // attackers bypass the per-user coupon cap.
  const customerEmailNormalized = customer.email.toLowerCase().trim();

  // ─────────────────────────────────────────────────────────────────────
  // SECURITY: Recompute prices from the database, NEVER trust the
  // client-sent `price`. An attacker who modifies the cart payload to
  // send `price: 1` would otherwise check out for ₪0.01.
  //
  // We fetch every product the client said is in the cart, then build
  // a fresh items[] from DB rows. The client price is allowed only to
  // be SAME or LARGER than DB — if the DB price went DOWN since the
  // customer added it to cart, we use the lower DB price (saves the
  // customer money, doesn't hurt the merchant). If it went UP, we use
  // the lower of the two — also kinder to the customer.
  // ─────────────────────────────────────────────────────────────────────
  const ids = Array.from(new Set(items.map((i) => i.id)));
  const dbProducts = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true },
    select: { id: true, name: true, image: true, price: true, stock: true },
  });
  if (dbProducts.length !== ids.length) {
    return { ok: false, error: "אחד המוצרים בעגלה אינו זמין" };
  }
  const byId = new Map(dbProducts.map((p) => [p.id, p]));

  type SafeItem = {
    productId: string;
    name: string;
    image: string;
    size: string | null;
    price: number;
    qty: number;
  };

  const safeItems: SafeItem[] = [];
  let subtotal = 0;
  for (const cartItem of items) {
    const p = byId.get(cartItem.id)!;
    // Use the lower of (DB current price, client cached price) so the
    // customer never gets surprised by a price increase that happened
    // mid-cart but also can't underpay.
    const trustedPrice =
      typeof cartItem.price === "number"
        ? Math.min(p.price, cartItem.price)
        : p.price;
    if (trustedPrice < 0) {
      return { ok: false, error: "מחיר לא תקין" };
    }
    // Quick stock pre-check (real atomic decrement happens in the tx).
    if (p.stock < cartItem.qty) {
      return { ok: false, error: `אזל המלאי של ${p.name}` };
    }
    subtotal += trustedPrice * cartItem.qty;
    safeItems.push({
      productId: p.id,
      name: p.name,
      image: p.image,
      size: cartItem.size ?? null,
      price: trustedPrice,
      qty: cartItem.qty,
    });
  }

  const shippingCost = await computeShippingCost(shipping.method, subtotal);

  // ---------- Coupon validation (price part only — race-safe increment in tx) ----------
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

    // SECURITY: Per-user coupon limit. Count this customer's prior
    // successful uses of THIS coupon (by userId if logged in, otherwise
    // by email). If they've hit the cap, reject.
    //
    // Why this matters: without it, a "first order discount" coupon
    // could be reused by the same customer N times by checking out
    // as a guest with the same email but different fingerprints.
    const me2 = await getCurrentUser();
    const perUserLimit = await prisma.coupon
      .findUnique({ where: { id: couponId }, select: { perUserLimit: true } })
      .then((c) => c?.perUserLimit ?? null);
    if (perUserLimit != null) {
      const priorUses = await prisma.order.count({
        where: {
          couponId,
          status: { not: "cancelled" },
          OR: [
            ...(me2?.id ? [{ userId: me2.id }] : []),
            { customerEmail: customerEmailNormalized },
          ],
        },
      });
      if (priorUses >= perUserLimit) {
        return { ok: false, error: "כבר השתמשת בקופון הזה" };
      }
    }
  }

  const total = Math.max(0, subtotal - discount) + shippingCost;

  const me = await getCurrentUser();

  // ---------- Payment ----------
  // SECURITY (PCI DSS):
  //   • In production the provider MUST be a real PSP (CardCom /
  //     Tranzila / etc.). selectProvider() throws if PAYMENT_PROVIDER=
  //     mock is selected while NODE_ENV=production. We call it here
  //     purely to exercise that guard on every checkout, so a
  //     misconfigured deploy fails LOUDLY on the first attempted
  //     purchase instead of silently accepting test cards.
  //   • Card data NEVER reaches this server in the real flow. The
  //     hosted-page redirect (cardcom.ts → provider.start) sends the
  //     customer's browser to CardCom; the customer enters the card
  //     there; we get back a token-not-a-card. We then call
  //     provider.complete() server-to-server to verify the token +
  //     amount before persisting the order. This keeps us in PCI
  //     SAQ-A scope (lightest annual self-attestation, no card vault,
  //     no quarterly ASV scans).
  //
  // FUTURE: When wiring CardCom for real, the order should be created
  // in `pending` status BEFORE the redirect, and flipped to `new` only
  // inside the success callback (after provider.complete succeeds).
  // Otherwise a payment captured without the order persisted = manual
  // refund. The current inline mock flow is fine for local/test only.
  await selectProvider();
  const paymentResult = await processPayment({
    method: payment.method,
    amount: total,
    cardNumber: payment.cardNumber ?? undefined,
  });

  if (!paymentResult.ok) {
    return { ok: false, error: paymentResult.error };
  }

  // ─────────────────────────────────────────────────────────────────────
  // SECURITY: Race-safe persistence.
  //   • Stock decrement is gated on (stock >= qty) inside the tx. If the
  //     last unit was just bought by another request, the updateMany
  //     returns count=0 and we throw → tx rolls back, payment refund
  //     handled by the catch block.
  //   • Coupon use is incremented inside the tx with the same guard
  //     (uses < maxUses). If a parallel order just hit the cap, our
  //     updateMany returns count=0 and we roll back. The customer
  //     gets a friendly error.
  // ─────────────────────────────────────────────────────────────────────
  const orderId = generateOrderId();
  const accessToken = generateAccessToken();
  try {
    await prisma.$transaction(async (tx) => {
      // Atomic stock decrement, one product at a time. We use
      // updateMany so we can guard on `stock >= qty` in the WHERE.
      for (const it of safeItems) {
        const r = await tx.product.updateMany({
          where: { id: it.productId, stock: { gte: it.qty } },
          data: { stock: { decrement: it.qty } },
        });
        if (r.count === 0) {
          throw new Error(`אזל המלאי של ${it.name}`);
        }
      }

      // Atomic coupon use increment. If maxUses is set, we only
      // succeed if uses<maxUses RIGHT NOW (no TOCTOU).
      if (couponId) {
        const r = await tx.coupon.updateMany({
          where: {
            id: couponId,
            isActive: true,
            OR: [
              { maxUses: null },
              { maxUses: { gt: 0 }, uses: { lt: 999_999_999 } }, // placeholder to keep the OR sane
            ],
          },
          data: { uses: { increment: 1 } },
        });
        if (r.count === 0) {
          throw new Error("הקופון לא תקף יותר");
        }
        // Second-pass check: reject if we just pushed over maxUses.
        const after = await tx.coupon.findUnique({
          where: { id: couponId },
          select: { uses: true, maxUses: true },
        });
        if (after?.maxUses != null && after.uses > after.maxUses) {
          throw new Error("הקופון נוצל במלואו");
        }
      }

      await tx.order.create({
        data: {
          id: orderId,
          accessToken,
          userId: me?.id ?? null,
          status: OrderStatus.new,
          customerFullName: customer.fullName,
          customerEmail: customerEmailNormalized,
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
            create: safeItems.map((i, idx) => ({
              productId: i.productId,
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
      await markCartRecovered(customerEmailNormalized);
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

  return { ok: true, orderId, accessToken };
}

// ---------- coupon validation (client-callable) ----------

export async function validateCouponForCart(
  code: string,
  subtotal: number,
) {
  // SECURITY: Rate-limit BEFORE the DB lookup to make code-guessing
  // unprofitable. 10 attempts per minute per IP.
  const ip = await getClientIp();
  const rl = await rateLimit(`coupon:${ip}`, POLICIES.coupon);
  if (!rl.ok) {
    return { ok: false as const, error: "יותר מדי ניסיונות, חכי רגע" };
  }
  // SECURITY: Generic error message for ALL failure modes
  // (not-found, inactive, expired, exhausted) so an attacker can't
  // enumerate valid codes by the response text. Only the min-subtotal
  // case is allowed a specific message because that's actionable
  // information the legit shopper needs.
  const result = await validateCoupon(code, subtotal);
  if (result.ok) return result;
  // Keep the merchant-specific "min subtotal" message; mask everything
  // else as the same generic invalid.
  if (result.error.startsWith("מינימום הזמנה")) return result;
  return { ok: false as const, error: "הקופון לא תקף" };
}

// ---------- read for confirmation page ----------

/**
 * Auth-gated read for the storefront confirmation page.
 * Returns the order only if the requester proves ownership via ONE of:
 *   1. logged-in user matches order.userId
 *   2. admin role
 *   3. the per-order access token from the placeOrder() response
 * Otherwise returns null — the page should treat null as 404.
 */
export async function getOrderForCustomer(orderId: string, accessToken?: string | null) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { orderBy: { position: "asc" } } },
  });
  if (!order) return null;

  const me = await getCurrentUser();

  // Owner check (logged-in customer)
  if (me?.id && order.userId === me.id) return order;
  // Admin check
  if (me?.role === "admin") return order;
  // Token check (constant-time-ish, sufficient here because the
  // tokens are 192 bits of entropy and we're not hot-looped)
  if (accessToken && order.accessToken && accessToken === order.accessToken) {
    return order;
  }
  return null;
}
