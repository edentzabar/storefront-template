import { siteConfig } from "@/lib/site-config";

export function formatPrice(
  price: number,
  locale = siteConfig.locale,
  currency = siteConfig.currency.symbol
) {
  return `${currency}${price.toLocaleString(locale)}`;
}
