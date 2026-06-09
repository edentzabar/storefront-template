"use server";

import { getProvider } from "./provider";
import { isAdmin } from "@/lib/session";
import { hebrewToSlug } from "@/lib/hebrew-slug";
import { rateLimit, getClientIp, POLICIES } from "@/lib/rate-limit";

/**
 * Translate a Hebrew category / product name into a URL-friendly
 * English slug using the configured AI provider.
 *
 *   "תכשיטי כסף"  → "silver-jewelry"
 *   "ארנקי עור"   → "leather-wallets"
 *
 * Falls back to the transliteration helper (hebrewToSlug) when the
 * AI provider is disabled or fails — the result isn't pretty
 * ("trkhshyty-ksp") but it's deterministic and URL-safe so the
 * category can still be saved.
 *
 * Admin-only. Rate-limited to keep this from being used to burn
 * the AI key.
 */
export async function translateNameToSlug(
  name: string,
): Promise<{ slug: string; usedFallback: boolean }> {
  if (!(await isAdmin())) {
    return { slug: "", usedFallback: true };
  }
  const trimmed = (name ?? "").trim();
  if (!trimmed) return { slug: "", usedFallback: true };

  // SECURITY: cap input + rate-limit so a sloppy effect loop in the
  // admin can't burn the API key.
  if (trimmed.length > 120) {
    return { slug: hebrewToSlug(trimmed.slice(0, 120)), usedFallback: true };
  }
  const ip = await getClientIp();
  const rl = await rateLimit(`slug:${ip}`, POLICIES.coupon);
  if (!rl.ok) {
    return { slug: hebrewToSlug(trimmed), usedFallback: true };
  }

  // If no AI provider is configured, fall back to transliteration.
  const { provider } = await getProvider();
  if (!provider) {
    return { slug: hebrewToSlug(trimmed), usedFallback: true };
  }

  // Tight prompt: one line in, one line out, no commentary. We ask
  // explicitly for the slug format so the model doesn't add quotes /
  // markdown / explanation. If the response doesn't match the
  // expected shape, fall back.
  const system = [
    "You translate Hebrew shopping category names into short English URL slugs.",
    "Output ONLY the slug: lowercase a–z, digits 0–9, hyphens. No quotes, no punctuation, no extra words.",
    "Keep it 1–3 words. Plural unless the name is clearly singular.",
    "Examples:",
    "תכשיטי כסף → silver-jewelry",
    "ארנקי עור → leather-wallets",
    "טבעות → rings",
    "חולצות גברים → mens-shirts",
  ].join("\n");

  try {
    const text = await provider.text(
      [
        { role: "system", content: system },
        { role: "user", content: trimmed },
      ],
      { maxTokens: 20 },
    );
    const candidate = text
      .toLowerCase()
      .replace(/[^a-z0-9-\s]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
    // Sanity: AI must have produced at least one Latin letter.
    if (!/[a-z]/.test(candidate)) {
      return { slug: hebrewToSlug(trimmed), usedFallback: true };
    }
    return { slug: candidate.slice(0, 120), usedFallback: false };
  } catch (err) {
    console.error("[translateNameToSlug] AI call failed:", err);
    return { slug: hebrewToSlug(trimmed), usedFallback: true };
  }
}
