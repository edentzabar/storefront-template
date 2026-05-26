"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdmin, getCurrentUser } from "@/lib/session";

const roleSchema = z.enum(UserRole);

async function assertAdmin() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
}

export async function updateUserRole(userId: string, role: string) {
  await assertAdmin();
  const me = await getCurrentUser();
  if (me?.id === userId) {
    return { ok: false, error: "אי אפשר לשנות את התפקיד של עצמך" };
  }
  const parsed = roleSchema.safeParse(role);
  if (!parsed.success) return { ok: false, error: "תפקיד לא חוקי" };
  await prisma.user.update({ where: { id: userId }, data: { role: parsed.data } });
  revalidatePath("/admin/customers");
  return { ok: true };
}

// ---------- tags & internal notes ----------

const tagSchema = z
  .string()
  .min(1)
  .max(24)
  .regex(/^[^\s,]+(\s[^\s,]+)*$/, "תיוג לא חוקי");

export async function addUserTag(userId: string, tag: string) {
  await assertAdmin();
  const parsed = tagSchema.safeParse(tag.trim());
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "תיוג לא חוקי" };
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { tags: true } });
  if (!user) return { ok: false, error: "משתמש לא נמצא" };
  const existing = (user.tags as unknown as string[]) ?? [];
  if (existing.includes(parsed.data)) return { ok: false, error: "תיוג כבר קיים" };
  await prisma.user.update({
    where: { id: userId },
    data: { tags: [...existing, parsed.data] },
  });
  revalidatePath(`/admin/customers/${userId}`);
  revalidatePath("/admin/customers");
  return { ok: true };
}

export async function removeUserTag(userId: string, tag: string) {
  await assertAdmin();
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { tags: true } });
  if (!user) return { ok: false, error: "משתמש לא נמצא" };
  const existing = (user.tags as unknown as string[]) ?? [];
  await prisma.user.update({
    where: { id: userId },
    data: { tags: existing.filter((t) => t !== tag) },
  });
  revalidatePath(`/admin/customers/${userId}`);
  revalidatePath("/admin/customers");
  return { ok: true };
}

const notesSchema = z.string().max(4000).nullable();

export async function updateUserNotes(userId: string, notes: string | null) {
  await assertAdmin();
  const parsed = notesSchema.safeParse(notes);
  if (!parsed.success) return { ok: false, error: "הערות ארוכות מדי" };
  await prisma.user.update({
    where: { id: userId },
    data: { internalNotes: parsed.data || null },
  });
  revalidatePath(`/admin/customers/${userId}`);
  return { ok: true };
}
