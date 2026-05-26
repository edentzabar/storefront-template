/**
 * ┌────────────────────────────────────────────────────────────────┐
 * │  PER-CLIENT CONFIG — change values here to re-skin the         │
 * │  template for a new deployment. This is the ONE place that     │
 * │  controls site-wide branding text (name, contact, social).     │
 * │                                                                │
 * │  Brand colors live in:  src/app/globals.css  (CSS variables)   │
 * │  Brand assets live in:  /public/brand/                         │
 * │  See THEMING.md for the full re-skin checklist.                │
 * └────────────────────────────────────────────────────────────────┘
 */
export const siteConfig = {
  /** Short brand name, shown in nav, sidebar, emails, OG tags */
  name: "Storefront",
  /** Sub-line under the brand name (e.g. "Fine Jewelry", "Boutique", "Atelier") */
  tagline: "",
  /** Full <title> for the homepage / fallback metadata */
  title: "Storefront",
  /** Default meta description (~150-160 chars) */
  description:
    "תיאור החנות לאתרי חיפוש ולשיתוף ברשתות חברתיות. שנה את הטקסט הזה ב-src/lib/site-config.ts.",
  /** SEO keywords (Hebrew + English mix is fine) */
  keywords: ["חנות", "אונליין", "ישראל"],
  /** Production URL — used for absolute links in JSON-LD, OG tags, sitemaps */
  url: "https://example.com",
  /** Path to OG share image under /public */
  ogImage: "/brand/og.png",
  /** BCP-47 locale for <html lang> + currency formatting */
  locale: "he-IL",
  /** Storefront currency. Symbol is shown next to prices in the UI. */
  currency: { symbol: "₪", code: "ILS" as const },
  contact: {
    phone: "050-000-0000",
    phoneIntl: "+972500000000",
    email: "hello@example.com",
    address: "ישראל",
    instagram: "",
    whatsapp: "",
  },
  shop: {
    /** Free shipping above this amount (currency.code units) */
    freeShippingMin: 500,
    /** Warranty text shown on product pages / footer */
    warranty: "אחריות יצרן",
    /** Max number of credit-card installments shown in checkout */
    maxInstallments: 12,
    /** Return-policy window in days */
    returnDays: 14,
    /** Shipping ETA shown in checkout (free text — e.g. "2-4") */
    shippingDays: "2-4",
  },
} as const;

export type SiteConfig = typeof siteConfig;
