"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/session";
import { getProvider, type ChatMessage, type ImageInput, type ProviderFailureReason } from "./provider";

/**
 * Generate a product description from its image + name + category.
 * Called from the product admin form (the "✨ צור תיאור" button next
 * to the description textarea).
 *
 * Returns the description text only — the caller decides whether to
 * append, replace, or save.
 */

const schema = z.object({
  productId: z.string().min(1),
  /** "describe" = standard catalog description.
   *  "meta" = short SEO meta description (≤160 chars).
   *  "seo-title" = SEO title (≤60 chars). */
  kind: z.enum(["describe", "meta", "seo-title"]).default("describe"),
  /** Optional extra prompt the merchant can add ("focus on craftsmanship",
   *  "target audience: athletes", etc.) */
  extra: z.string().default(""),
});

export type GenerateResult =
  | { ok: true; text: string; provider: string }
  | { ok: false; reason: "disabled" | "no-provider" | "no-key" | "not-found" | "no-image" | "error"; message: string };

export async function generateDescription(input: z.infer<typeof schema>): Promise<GenerateResult> {
  if (!(await isAdmin())) {
    return { ok: false, reason: "error", message: "Unauthorized" };
  }
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, reason: "error", message: parsed.error.message };
  }

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
    include: { category: { select: { name: true, nameEn: true } } },
  });
  if (!product) return { ok: false, reason: "not-found", message: "מוצר לא נמצא" };
  if (!product.image)
    return { ok: false, reason: "no-image", message: "אין תמונה למוצר — הוסיפו תמונה לפני יצירת תיאור" };

  const { provider, reason } = await getProvider();
  if (!provider) {
    return {
      ok: false,
      reason,
      message: REASON_TEXT[reason],
    };
  }

  const system: ChatMessage = {
    role: "system",
    content: buildSystemPrompt(parsed.data.kind),
  };
  const user: ChatMessage = {
    role: "user",
    content: buildUserPrompt({
      kind: parsed.data.kind,
      productName: product.name,
      productMeta: product.meta,
      categoryName: product.category?.name ?? "",
      extra: parsed.data.extra,
    }),
  };

  const image: ImageInput = { source: product.image };

  try {
    const text = await provider.vision([image], [system, user], {
      maxTokens: parsed.data.kind === "describe" ? 600 : 180,
    });
    return { ok: true, text: text.trim(), provider: provider.name };
  } catch (err) {
    return {
      ok: false,
      reason: "error",
      message: err instanceof Error ? err.message : "שגיאה ב-AI",
    };
  }
}

const REASON_TEXT: Record<"disabled" | "no-provider" | "no-key" | "ok", string> = {
  disabled: "AI מבוטל. הפעילו ב-/admin/settings → AI.",
  "no-provider": "לא נבחר ספק AI. בחרו ב-/admin/settings → AI.",
  "no-key": "מפתח API חסר. הכניסו ב-/admin/settings → AI או דרך משתנה סביבה.",
  ok: "",
};

function buildSystemPrompt(kind: "describe" | "meta" | "seo-title"): string {
  const role =
    "אתה עורך תוכן של חנות איקומרס ישראלית. אתה כותב טקסטים בעברית, ברורים, מותאמים למובייל, בטון מקצועי אבל אנושי.";
  if (kind === "seo-title") {
    return `${role} המשימה: כתיבת SEO title באורך עד 60 תווים שמתאר את המוצר ומכיל מילות מפתח. החזר רק את הכותרת — בלי הסברים.`;
  }
  if (kind === "meta") {
    return `${role} המשימה: כתיבת תיאור SEO meta באורך עד 160 תווים, מסכם את היתרון העיקרי + מילת מפתח. החזר רק את הטקסט.`;
  }
  return `${role} המשימה: כתיבת תיאור מוצר באורך 80-140 מילים, פסקה אחת או שתיים, מציין חומר/טכנולוגיה/תועלות, מסיים בקריאה לפעולה עדינה. החזר רק את הטקסט.`;
}

function buildUserPrompt(args: {
  kind: "describe" | "meta" | "seo-title";
  productName: string;
  productMeta: string;
  categoryName: string;
  extra: string;
}): string {
  const lines = [
    `שם מוצר: ${args.productName}`,
    args.productMeta ? `תיאור קצר קיים: ${args.productMeta}` : "",
    args.categoryName ? `קטגוריה: ${args.categoryName}` : "",
    args.extra ? `הנחיות נוספות: ${args.extra}` : "",
    "",
    args.kind === "describe"
      ? "התבונן בתמונה וכתוב תיאור מוצר מנצח."
      : args.kind === "meta"
        ? "התבונן בתמונה וכתוב תיאור SEO meta."
        : "התבונן בתמונה וכתוב SEO title.",
  ];
  return lines.filter(Boolean).join("\n");
}
