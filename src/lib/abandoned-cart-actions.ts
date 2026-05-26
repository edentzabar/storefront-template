"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";

const itemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  image: z.string(),
  size: z.string().nullable(),
  price: z.coerce.number().int().min(0),
  qty: z.coerce.number().int().min(1),
});

const saveSchema = z.object({
  email: z.string().email("אימייל לא תקין"),
  customerName: z.string().nullable().optional(),
  items: z.array(itemSchema).min(1),
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
