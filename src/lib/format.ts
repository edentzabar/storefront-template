import { siteConfig } from "@/lib/site-config";

export function formatPrice(
  price: number,
  locale = siteConfig.locale,
  currency = siteConfig.currency.symbol
) {
  return `${currency}${price.toLocaleString(locale)}`;
}

/**
 * Build a `tel:` href from a display phone number. Strips spaces, dashes,
 * parens, and dots; converts a leading "0" to "+972" (Israel default).
 * This lets us drop the separate "international phone" admin field.
 *
 * Override the country via `defaultCountry` when shipping outside IL.
 */
export function telHref(displayPhone: string, defaultCountry = "+972") {
  if (!displayPhone) return "";
  const cleaned = displayPhone.replace(/[\s\-().]/g, "");
  if (cleaned.startsWith("+")) return `tel:${cleaned}`;
  if (cleaned.startsWith("0")) return `tel:${defaultCountry}${cleaned.slice(1)}`;
  return `tel:${cleaned}`;
}
