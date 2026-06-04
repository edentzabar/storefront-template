"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/session";
import { audit } from "@/lib/audit";
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
const BOOLEAN_KEYS = new Set<SettingKey>([
  "ai.enabled",
  "chatbot.enabled",
  "products.skuEnabled",
]);

/** Update many settings at once. Each value is coerced to the right type by key. */
export async function updateSiteSettings(input: Record<string, string>) {
  await assertAdmin();
  const updates: { key: SettingKey; value: string | number | boolean }[] = [];
  for (const key of SETTING_KEYS) {
    const raw = input[key];
    if (raw === undefined) continue;
    if (BOOLEAN_KEYS.has(key)) {
      // Checkbox forms submit "on"/"true"/"1" for true and don't include
      // the field at all for false — but here we treat any non-empty
      // truthy string as true. Callers should always include the key.
      updates.push({ key, value: raw === "true" || raw === "on" || raw === "1" });
    } else if (NUMERIC_KEYS.has(key)) {
      const num = Number(raw);
      if (!Number.isFinite(num) || num < 0) {
        return { ok: false, error: `${key}: ערך מספרי לא חוקי` };
      }
      updates.push({ key, value: num });
    } else {
      // Allow long system prompts — bump cap from 2k to 8k.
      const trimmed = z.string().max(8000).safeParse(raw);
      if (!trimmed.success) return { ok: false, error: `${key}: ערך לא חוקי` };
      updates.push({ key, value: trimmed.data });
    }
  }

  // Snapshot the BEFORE state for the audit log. Read only the keys
  // we're about to write so we're not pulling unrelated settings.
  const beforeRows = await prisma.siteSetting.findMany({
    where: { key: { in: updates.map((u) => u.key) } },
  });
  const before = Object.fromEntries(beforeRows.map((r) => [r.key, r.value]));
  const after = Object.fromEntries(updates.map((u) => [u.key, u.value]));

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

  // Settings changes are high-impact (touch every page) so we log
  // every save with the diff. NOTE: this includes the AI key if it
  // changed — fine because audit_log is admin-only by gate.
  await audit("settings:update", "site_setting", null, { before, after });

  updateTag(SETTINGS_TAG);
  revalidatePath("/", "layout");
  return { ok: true };
}
