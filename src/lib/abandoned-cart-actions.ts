"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp, POLICIES } from "@/lib/rate-limit";

const itemSchema = z.object({
  id: z.string().max(200),
  slug: z.string().max(200),
  name: z.string().max(200),
  image: z.string().max(2000),
  size: z.string().max(40).nullable(),
  price: z.coerce.number().int().min(0).max(100_000_00),
  qty: z.coerce.number().int().min(1).max(99),
});

const saveSchema = z.object({
  email: z.string().email("אימייל לא תקין").max(254),
  customerName: z.string().max(120).nullable().optional(),
  items: z.array(itemSchema).min(1).max(100),
});

/**
 * Record an in-progress cart for abandoned-cart recovery. Called from the
 * checkout flow when the user submits their email (step 1 → step 2).
 * Subsequent calls for the same email + items will update the existing
 * row instead of creating duplicates.
 */
export async function saveAbandonedCart(input: unknown) {
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  // SECURITY: Rate-limit by IP to prevent spam abandoned-cart records
  // (which would also queue spam recovery emails).
  const ip = await getClientIp();
  const rl = await rateLimit(`abandoned:${ip}`, POLICIES.generic);
  if (!rl.ok) return { ok: false, error: "יותר מדי בקשות" };

  const { email, customerName, items } = parsed.data;
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const normalizedEmail = email.toLowerCase().trim();

  // Find the most recent unrecovered cart for this email
  const existing = await prisma.abandonedCart.findFirst({
    where: { email: normalizedEmail, recoveredAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    await prisma.abandonedCart.update({
      where: { id: existing.id },
      data: {
        customerName: customerName ?? existing.customerName,
        items,
        subtotal,
        // reset reminderSentAt so we'll email again if they abandon a *new* cart later
        reminderSentAt: null,
      },
    });
    return { ok: true, id: existing.id };
  }

  const created = await prisma.abandonedCart.create({
    data: {
      email: normalizedEmail,
      customerName: customerName ?? null,
      items,
      subtotal,
    },
  });
  return { ok: true, id: created.id };
}

/** Mark a cart as recovered (used when checkout succeeds with the same email). */
export async function markCartRecovered(email: string) {
  const normalizedEmail = email.toLowerCase().trim();
  await prisma.abandonedCart.updateMany({
    where: { email: normalizedEmail, recoveredAt: null },
    data: { recoveredAt: new Date() },
  });
}
