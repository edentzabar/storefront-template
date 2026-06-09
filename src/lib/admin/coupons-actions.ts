"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CouponType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/session";
import { audit } from "@/lib/audit";

async function assertAdmin() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
}

const couponSchema = z.object({
  code: z
    .string()
    .min(2, "קוד קצר מדי")
    .max(40, "קוד ארוך מדי")
    .regex(/^[A-Z0-9_-]+$/i, "קוד יכול להכיל אותיות, ספרות, _ ו--"),
  description: z.string().max(200).default(""),
  type: z.enum(CouponType),
  value: z.coerce.number().int().min(1, "ערך חייב להיות חיובי"),
  minSubtotal: z.coerce.number().int().min(0).default(0),
  maxUses: z.coerce.number().int().min(1).nullable().default(null),
  /** null = unlimited, 1 = "one per customer" (common welcome flow). */
  perUserLimit: z.coerce.number().int().min(1).nullable().default(null),
  expiresAt: z.string().nullable().default(null),
  isActive: z.boolean().default(true),
});

export type CouponInput = z.infer<typeof couponSchema>;

function normalize(input: unknown) {
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "קלט לא חוקי" };
  }
  const data = parsed.data;
  if (data.type === "percent" && (data.value < 1 || data.value > 100)) {
    return { ok: false as const, error: "אחוז חייב להיות בין 1 ל-100" };
  }
  return {
    ok: true as const,
    data: {
      code: data.code.toUpperCase().trim(),
      description: data.description ?? "",
      type: data.type,
      value: data.value,
      minSubtotal: data.minSubtotal,
      maxUses: data.maxUses,
      perUserLimit: data.perUserLimit,
      // Admin picks a date like "2026-06-10" expecting the coupon to
       // stay valid through that whole day in Israel. `new Date("2026-06-10")`
       // parses as 00:00 UTC = 02:00 IL on 10 June, so the coupon
       // would expire at 03:00 IL Tuesday morning instead of 23:59
       // Tuesday night. We add ~24h minus 1s so it expires at end of
       // day Israel time (offset varies with DST: +2 in winter, +3 in
       // summer; using 23:59:59 UTC keeps it correct in both cases
       // because Israel is always ahead of UTC).
      expiresAt: data.expiresAt
        ? new Date(`${data.expiresAt}T23:59:59Z`)
        : null,
      isActive: data.isActive,
    },
  };
}

export async function createCoupon(input: unknown) {
  await assertAdmin();
  const normalized = normalize(input);
  if (!normalized.ok) return { ok: false, error: normalized.error };
  try {
    const c = await prisma.coupon.create({ data: normalized.data });
    await audit("coupon:create", "coupon", c.id, { after: normalized.data });
    revalidatePath("/admin/coupons");
    return { ok: true, id: c.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "שגיאה";
    if (msg.includes("Unique constraint")) return { ok: false, error: "קוד זה כבר קיים" };
    return { ok: false, error: msg };
  }
}

export async function updateCoupon(id: string, input: unknown) {
  await assertAdmin();
  const normalized = normalize(input);
  if (!normalized.ok) return { ok: false, error: normalized.error };
  const before = await prisma.coupon.findUnique({ where: { id } });
  try {
    await prisma.coupon.update({ where: { id }, data: normalized.data });
    await audit("coupon:update", "coupon", id, { before, after: normalized.data });
    revalidatePath("/admin/coupons");
    revalidatePath(`/admin/coupons/${id}/edit`);
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "שגיאה";
    if (msg.includes("Unique constraint")) return { ok: false, error: "קוד זה כבר קיים" };
    return { ok: false, error: msg };
  }
}

export async function deleteCoupon(id: string) {
  await assertAdmin();
  const before = await prisma.coupon.findUnique({ where: { id } });
  try {
    await prisma.coupon.delete({ where: { id } });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "שגיאה" };
  }
  await audit("coupon:delete", "coupon", id, { before });
  revalidatePath("/admin/coupons");
  return { ok: true };
}

export async function toggleCouponActive(id: string, isActive: boolean) {
  await assertAdmin();
  const before = await prisma.coupon.findUnique({
    where: { id },
    select: { isActive: true },
  });
  await prisma.coupon.update({ where: { id }, data: { isActive } });
  await audit("coupon:toggle", "coupon", id, {
    before: { isActive: before?.isActive },
    after: { isActive },
  });
  revalidatePath("/admin/coupons");
  return { ok: true };
}
