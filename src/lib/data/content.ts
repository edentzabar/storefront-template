/**
 * Editable site copy & nav. Keep all customer-facing text here.
 *
 * This file is intentionally generic. Replace the strings + nav
 * entries to fit the client's vertical. Anything that's brand-name
 * dependent reads from siteConfig — see src/lib/site-config.ts.
 */
import { siteConfig } from "@/lib/site-config";

export const announcement = `משלוח חינם בהזמנות מעל ₪${siteConfig.shop.freeShippingMin} ✦ החזרה תוך ${siteConfig.shop.returnDays} ימים ✦ תשלום עד ${siteConfig.shop.maxInstallments} תשלומים`;

/**
 * Main nav. Replace with the client's real categories — the slugs
 * here must match the slugs in src/lib/data/categories.ts (and the
 * Category rows seeded in prisma/seed.ts).
 */
export const navItems = [
  { id: "all", label: "כל הקולקציה", href: "/" },
  { id: "new", label: "חדש", href: "/shop?filter=new" },
  { id: "shop", label: "החנות", href: "/shop" },
  { id: "sale", label: "מבצעים", href: "/sale" },
] as const;

export const hero = {
  image: "/brand/hero.jpg",
  eyebrow: "ברוכים הבאים",
  titleBefore: "החנות ",
  titleAccent: "החדשה",
  subtitle: "תיאור קצר ומזמין של מה שמחכה ללקוח. שנה את הטקסט הזה ב-src/lib/data/content.ts.",
  ctaText: "לקולקציה",
  ctaHref: "/shop",
} as const;

export const sections = {
  categories: {
    eyebrow: "Collections",
    titleBefore: "קטגוריות ",
    titleAccent: "נבחרות",
    subtitle: "בחרו את הקטגוריה שמתאימה לכם",
  },
  products: {
    eyebrow: "Featured",
    titleBefore: "המוצרים ",
    titleAccent: "הנבחרים",
    titleAfter: " שלנו",
    subtitle: "המוצרים הנמכרים ביותר בחנות",
    ctaText: "לכל הקולקציה",
    ctaHref: "/shop",
  },
  cta: {
    eyebrow: "Get in touch",
    titleLine1: "רוצים ",
    titleAccent: "לדבר?",
    titleLine2: "אנחנו פה",
    subtitle: "צרו איתנו קשר לכל שאלה, הזמנה מיוחדת או ייעוץ.",
    ctaText: "צור קשר",
    ctaHref: "/contact",
  },
  about: {
    eyebrow: "About",
    titleLine1: "הסיפור ",
    titleAccent: "שלנו",
    titleLine2: "",
    paragraphs: [
      "פסקה ראשונה על המותג. מי אתם, מה אתם עושים, ולמה זה חשוב. שנה ב-src/lib/data/content.ts.",
      "פסקה שנייה. ערכי המותג, החזון, מה מבדל אתכם מהמתחרים.",
    ],
    image: "/brand/about.jpg",
    ctaText: "קראו עוד",
    ctaHref: "/contact",
  },
} as const;

export const footer = {
  brandDescription:
    "תיאור קצר של המותג בפוטר. שורה-שתיים שמסכמות מה החנות עושה ולמי היא מיועדת.",
  /**
   * Footer columns — edit to match the storefront's actual structure.
   * Contact column reads from siteConfig so brand-name swaps propagate.
   */
  columns: [
    {
      title: "חנות",
      links: [
        { label: "כל הקולקציה", href: "/shop" },
        { label: "חדש", href: "/shop?filter=new" },
        { label: "מבצעים", href: "/sale" },
      ],
    },
    {
      title: "שירות",
      links: [
        { label: "משלוחים", href: "/shipping" },
        { label: "החזרות", href: "/returns" },
        { label: "מדריך מידות", href: "/size-guide" },
        { label: "מדיניות פרטיות", href: "/privacy" },
        { label: "תקנון", href: "/terms" },
      ],
    },
    {
      title: "צור קשר",
      links: [
        { label: siteConfig.contact.phone, href: `tel:${siteConfig.contact.phoneIntl}` },
        { label: siteConfig.contact.email, href: `mailto:${siteConfig.contact.email}` },
        ...(siteConfig.contact.instagram
          ? [{ label: "Instagram", href: siteConfig.contact.instagram }]
          : []),
        ...(siteConfig.contact.whatsapp
          ? [{ label: "WhatsApp", href: siteConfig.contact.whatsapp }]
          : []),
      ],
    },
  ],
  copyright: (year = new Date().getFullYear()) =>
    `© ${year} ${siteConfig.name}${siteConfig.tagline ? ` ${siteConfig.tagline}` : ""}. כל הזכויות שמורות.`,
} as const;
