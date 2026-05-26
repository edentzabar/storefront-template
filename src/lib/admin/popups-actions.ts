"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PopupAudience, PopupFrequency, PopupPage, PopupTrigger } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/session";

async function assertAdmin() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
}

const popupSchema = z.object({
  name: z.string().min(1, "שם חובה").max(80),
  title: z.string().min(1, "כותרת חובה").max(120),
  body: z.string().min(1, "טקסט חובה").max(800),
  imageUrl: z.string().nullable().optional(),
  ctaText: z.string().max(40).nullable().optional(),
  ctaUrl: z.string().max(500).nullable().optional(),
  couponCode: z.string().max(40).nullable().optional(),

  triggerType: z.enum(PopupTrigger).default("delay"),
  triggerValue: z.coerce.number().int().min(0).max(600).default(5),

  frequencyType: z.enum(PopupFrequency).default("session"),
  frequencyDays: z.coerce.number().int().min(1).max(365).default(7),

  audience: z.enum(PopupAudience).default("all"),
  pageTarget: z.enum(PopupPage).default("all"),

  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  isActive: z.coerce.boolean().default(false),
});

export type PopupInput = z.infer<typeof popupSchema>;

function normalize(input: unknown) {
  const parsed = popupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "קלט לא חוקי" };
  }
  const d = parsed.data;
  return {
    ok: true as const,
    data: {
      name: d.name.trim(),
      title: d.title.trim(),
      body: d.body,
      imageUrl: d.imageUrl?.trim() || null,
      ctaText: d.ctaText?.trim() || null,
      ctaUrl: d.ctaUrl?.trim() || null,
      couponCode: d.couponCode?.trim().toUpperCase() || null,
      triggerType: d.triggerType,
      triggerValue: d.triggerValue,
      frequencyType: d.frequencyType,
      frequencyDays: d.frequencyDays,
      audience: d.audience,
      pageTarget: d.pageTarget,
      startsAt: d.startsAt ? new Date(d.startsAt) : null,
      endsAt: d.endsAt ? new Date(d.endsAt) : null,
      isActive: d.isActive,
    },
  };
}

export async function createPopup(input: unknown) {
  await assertAdmin();
  const n = normalize(input);
  if (!n.ok) return { ok: false, error: n.error };
  const created = await prisma.popupCampaign.create({ data: n.data });
  revalidatePath("/admin/popups");
  revalidatePath("/", "layout");
  return { ok: true, id: created.id };
}

export async function updatePopup(id: string, input: unknown) {
  await assertAdmin();
  const n = normalize(input);
  if (!n.ok) return { ok: false, error: n.error };
  await prisma.popupCampaign.update({ where: { id }, data: n.data });
  revalidatePath("/admin/popups");
  revalidatePath(`/admin/popups/${id}/edit`);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deletePopup(id: string) {
  await assertAdmin();
  try {
    await prisma.popupCampaign.delete({ where: { id } });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "שגיאה" };
  }
  revalidatePath("/admin/popups");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function togglePopupActive(id: string, isActive: boolean) {
  await assertAdmin();
  await prisma.popupCampaign.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/popups");
  revalidatePath("/", "layout");
  return { ok: true };
}
