/**
 * Hebrew → Latin transliteration for URL slugs.
 *
 * The output isn't beautiful ("שרשרת זהב" → "shrshrt-zhv") but it IS:
 *   • Deterministic — same input always gives same slug
 *   • URL-safe — only [a-z0-9-]
 *   • Unique enough — most product names produce distinct output
 *
 * Customers never type slugs by hand. Search bots and link-sharing
 * preview the product name in surrounding context — the URL string
 * itself is rarely the deciding factor for SEO either way.
 *
 * If/when an AI provider is configured we can swap this for an LLM
 * translation that produces "gold-necklace" instead. The call site
 * is one function.
 */

const HEB_MAP: Record<string, string> = {
  // Standard 22 letters
  "א": "a",
  "ב": "b",
  "ג": "g",
  "ד": "d",
  "ה": "h",
  "ו": "v",
  "ז": "z",
  "ח": "h",
  "ט": "t",
  "י": "y",
  "כ": "k",
  "ל": "l",
  "מ": "m",
  "נ": "n",
  "ס": "s",
  "ע": "a",
  "פ": "p",
  "צ": "tz",
  "ק": "k",
  "ר": "r",
  "ש": "sh",
  "ת": "t",
  // Final-letter forms
  "ך": "k",
  "ם": "m",
  "ן": "n",
  "ף": "p",
  "ץ": "tz",
};

export function hebrewToSlug(input: string): string {
  if (!input) return "";
  let out = "";
  for (const char of input) {
    if (HEB_MAP[char]) {
      out += HEB_MAP[char];
    } else if (/[a-zA-Z0-9]/.test(char)) {
      out += char.toLowerCase();
    } else if (/\s/.test(char)) {
      out += "-";
    }
    // anything else → stripped
  }
  return out
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}
