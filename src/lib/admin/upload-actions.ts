"use server";

import { put } from "@vercel/blob";
import { isAdmin } from "@/lib/session";

async function assertAdmin() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
}

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/svg+xml"];
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export async function uploadImage(formData: FormData) {
  await assertAdmin();

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      ok: false,
      error:
        "אחסון תמונות לא מוגדר. הוסף את ה-Vercel Blob ל-project (Storage → Connect Blob) — אחרי זה ה-token יתווסף אוטומטית.",
    };
  }

  const file = formData.get("file") as File | null;
  const purpose = (formData.get("purpose") as string | null) ?? "misc";
  if (!file) return { ok: false, error: "לא נבחר קובץ" };
  if (!ALLOWED.includes(file.type)) {
    return { ok: false, error: `סוג קובץ לא נתמך (${file.type})` };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: `הקובץ גדול מדי (מקסימום ${MAX_BYTES / 1024 / 1024}MB)` };
  }

  // Use original name but stamp with timestamp to avoid collisions.
  const ext = file.name.split(".").pop() ?? "bin";
  const safeName = `${purpose}-${Date.now()}.${ext}`;

  try {
    const blob = await put(safeName, file, {
      access: "public",
      addRandomSuffix: false,
    });
    return { ok: true, url: blob.url, pathname: blob.pathname };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "שגיאה בהעלאה" };
  }
}
