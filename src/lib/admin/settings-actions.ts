"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/session";
import {
  SETTING_KEYS,
  SETTINGS_TAG,
  type SettingKey,
} from "@/lib/site-settings";

async function assertAdmin() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
}

const NUMERIC_KEYS = new Set<SettingKey>([
  "shop.freeShippingMin",
  "shop.maxInstallments",
  "shop.returnDays",
]);

/** Update many settings at once. Each value is coerced to the right type by key. */
export async function updateSiteSettings(input: Record<string, string>) {
  await assertAdmin();
  const updates: { key: SettingKey; value: string | number }[] = [];
  for (const key of SETTING_KEYS) {
    const raw = input[key];
    if (raw === undefined) continue;
    if (NUMERIC_KEYS.has(key)) {
      const num = Number(raw);
      if (!Number.isFinite(num) || num < 0) {
        return { ok: false, error: `${key}: ערך מספרי לא חוקי` };
      }
      updates.push({ key, value: num });
    } else {
      const trimmed = z.string().max(2000).safeParse(raw);
      if (!trimmed.success) return { ok: false, error: `${key}: ערך לא חוקי` };
      updates.push({ key, value: trimmed.data });
    }
  }

  // Atomic upsert
  await prisma.$transaction(
    updates.map((u) =>
      prisma.siteSetting.upsert({
        where: { key: u.key },
        create: { key: u.key, value: u.value },
        update: { value: u.value },
      }),
    ),
  );

  updateTag(SETTINGS_TAG);
  revalidatePath("/", "layout");
  return { ok: true };
}
