import { prisma } from "@/lib/prisma";
import type { Coupon } from "@prisma/client";

export type AppliedCoupon = {
  code: string;
  description: string;
  type: "percent" | "amount";
  value: number;
  discount: number; // computed discount in agorot
  couponId: string;
};

export type CouponValidation =
  | { ok: true; applied: AppliedCoupon }
  | { ok: false; error: string };

/** Validate a coupon code against a cart subtotal. Returns the computed discount. */
export async function validateCoupon(
  code: string,
  subtotal: number,
): Promise<CouponValidation> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { ok: false, error: "אין קוד" };

  const coupon = await prisma.coupon.findUnique({ where: { code: normalized } });
  if (!coupon) return { ok: false, error: "קוד לא קיים" };
  if (!coupon.isActive) return { ok: false, error: "הקופון לא פעיל" };
  if (coupon.expiresAt && coupon.expiresAt < new Date())
    return { ok: false, error: "הקופון פג תוקף" };
  if (coupon.maxUses && coupon.uses >= coupon.maxUses)
    return { ok: false, error: "הקופון נוצל במלואו" };
  if (subtotal < coupon.minSubtotal)
    return {
      ok: false,
      error: `מינימום הזמנה לקופון הוא ₪${coupon.minSubtotal.toLocaleString("he-IL")}`,
    };

  const discount = computeDiscount(coupon, subtotal);
  return {
    ok: true,
    applied: {
      code: coupon.code,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value,
      discount,
      couponId: coupon.id,
    },
  };
}

export function computeDiscount(
  coupon: Pick<Coupon, "type" | "value">,
  subtotal: number,
): number {
  if (coupon.type === "percent") {
    return Math.min(subtotal, Math.round((subtotal * coupon.value) / 100));
  }
  return Math.min(subtotal, coupon.value);
}
