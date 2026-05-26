/** Strip HTML tags + decode common entities. Used for Shopify Body (HTML)
 *  and WooCommerce description fields. */
export function stripHtml(html: string): string {
  if (!html) return "";
  // Replace block-level tags with newlines for readability
  const withBreaks = html
    .replace(/<\s*\/?(p|br|div|li)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  // Decode entities (basic set)
  const decoded = withBreaks
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  // Collapse 3+ newlines
  return decoded
    .split("\n")
    .map((l) => l.trim())
    .filter((l, i, arr) => !(l === "" && arr[i - 1] === ""))
    .join("\n")
    .trim();
}

/** Convert a string to a URL-safe slug (Latin only). */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Parse a possibly-empty numeric string. Returns null for "", undefined, or NaN. */
export function parseNumber(value: string | undefined | null): number | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  // Strip currency symbols and thousands separators
  const cleaned = trimmed.replace(/[₪$€,\s]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Parse an integer with the same cleaning logic, defaulting to 0. */
export function parseInteger(value: string | undefined | null, fallback = 0): number {
  const n = parseNumber(value);
  return n == null ? fallback : Math.round(n);
}

/** Parse boolean from common truthy strings (1, true, yes, TRUE, on, visible, ...). */
export function parseBoolean(value: string | undefined | null, fallback = false): boolean {
  if (value == null) return fallback;
  const v = String(value).trim().toLowerCase();
  if (v === "") return fallback;
  return ["1", "true", "yes", "y", "on", "visible", "instock", "active", "published"].includes(v);
}
