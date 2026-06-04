"use server";

import { z } from "zod";
import { getSiteSettings } from "@/lib/site-settings";
import { getProvider, type ChatMessage } from "./provider";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp, POLICIES } from "@/lib/rate-limit";

/**
 * Chatbot turn — caller passes the full history (or a recent slice)
 * + the new user message, gets back the assistant's reply.
 *
 * The system prompt is assembled fresh on every call from:
 *   • Hardcoded base persona ("you're a shop assistant for X")
 *   • Site copy (free-shipping minimum, return window, contact info)
 *   • A short catalog snapshot (active categories + a sample of products)
 *   • The merchant's free-text extra from /admin/settings → chatbot
 *
 * Caps the catalog snapshot so the prompt stays small. For larger
 * catalogs we'd want retrieval-augmented generation (RAG) — flagged
 * in the AI roadmap.
 */

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

const inputSchema = z.object({
  history: z.array(messageSchema).max(20).default([]),
  message: z.string().min(1).max(2000),
});

export type ChatbotReply =
  | { ok: true; text: string }
  | { ok: false; reason: "disabled" | "no-provider" | "no-key" | "error"; message: string };

const CONTEXT_CACHE_TTL_MS = 60_000; // re-pull catalog snapshot at most once a minute
let cachedContext: { at: number; text: string } | null = null;

export async function chatbotReply(input: z.infer<typeof inputSchema>): Promise<ChatbotReply> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, reason: "error", message: "פנייה לא תקינה" };
  }

  // SECURITY: Rate-limit before touching the AI provider. Two layers:
  //   • Per-minute spike cap (10/min/IP)
  //   • Daily cap (80/day/IP) on top of that
  // Both must be checked before the LLM call, otherwise an attacker
  // can burn the API key with a single 10-second burst.
  const ip = await getClientIp();
  const minute = await rateLimit(`chatbot:m:${ip}`, POLICIES.chatbot);
  if (!minute.ok) {
    return { ok: false, reason: "error", message: "יותר מדי בקשות, חכי רגע ותנסי שוב" };
  }
  const daily = await rateLimit(`chatbot:d:${ip}`, POLICIES.chatbotDaily);
  if (!daily.ok) {
    return { ok: false, reason: "error", message: "הגעת למכסת השאלות היומית, ננסה מחר" };
  }

  const settings = await getSiteSettings();
  if (!settings.chatbot.enabled) {
    return { ok: false, reason: "disabled", message: "הצ'אטבוט כבוי" };
  }

  const { provider, reason } = await getProvider();
  if (!provider) {
    return { ok: false, reason, message: REASON_TEXT[reason] };
  }

  const context = await getCatalogContext();
  const systemPrompt = [
    `אתה עוזר חנות אונליין של "${settings.brand.name}". ענה תמיד בעברית, בטון ידידותי וקצר. אל תמציא מוצרים שאינם בקטלוג.`,
    "אם הלקוחה שואלת על מוצר שלא קיים — הציעי מוצר דומה מהקטלוג למטה.",
    `משלוח חינם מעל ₪${settings.shop.freeShippingMin}. החזרות תוך ${settings.shop.returnDays} ימים.`,
    settings.contact.phone && `טלפון: ${settings.contact.phone}`,
    settings.contact.email && `אימייל: ${settings.contact.email}`,
    settings.contact.whatsapp && `ווטסאפ: ${settings.contact.whatsapp}`,
    "",
    "─── הקטלוג ───",
    context,
    "─── סוף קטלוג ───",
    settings.chatbot.systemPromptExtra,
  ]
    .filter(Boolean)
    .join("\n");

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...parsed.data.history,
    { role: "user", content: parsed.data.message },
  ];

  try {
    const text = await provider.text(messages, { maxTokens: 400 });
    return { ok: true, text: text.trim() };
  } catch (err) {
    // SECURITY: Do NOT echo the provider's error message to the
    // client. It can leak the model name, request id, sometimes
    // even a partial key in misconfigured proxies. Log the real
    // error server-side; return a generic message to the user.
    console.error("[chatbot] provider call failed:", err);
    return {
      ok: false,
      reason: "error",
      message: "שגיאה בתקשורת. נסי שוב.",
    };
  }
}

async function getCatalogContext(): Promise<string> {
  if (cachedContext && Date.now() - cachedContext.at < CONTEXT_CACHE_TTL_MS) {
    return cachedContext.text;
  }
  const [cats, prods] = await Promise.all([
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: { sortOrder: "asc" },
      take: 12,
      select: { name: true, nameEn: true },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 30,
      select: { name: true, meta: true, price: true, category: { select: { name: true } } },
    }),
  ]);
  const lines: string[] = [];
  if (cats.length) {
    lines.push("קטגוריות: " + cats.map((c) => c.name).join(" / "));
  }
  for (const p of prods) {
    lines.push(`• ${p.name}${p.meta ? ` (${p.meta})` : ""} — ₪${p.price}${p.category?.name ? ` [${p.category.name}]` : ""}`);
  }
  const text = lines.join("\n");
  cachedContext = { at: Date.now(), text };
  return text;
}

const REASON_TEXT: Record<"disabled" | "no-provider" | "no-key" | "ok", string> = {
  disabled: "הצ'אטבוט כבוי",
  "no-provider": "ספק AI לא הוגדר",
  "no-key": "מפתח API חסר",
  ok: "",
};
