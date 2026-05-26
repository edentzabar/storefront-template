import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/site-config";
import { announcement as defaultAnnouncement, hero as defaultHero } from "@/lib/data/content";

const SETTINGS_TAG = "site-settings";

/**
 * Editable settings. Defaults come from `siteConfig` + content data; any value
 * stored in the `SiteSetting` table overrides the default.
 */
export type EditableSettings = {
  brand: {
    name: string;
    tagline: string;
    logoUrl: string; // empty = use default text logo
  };
  contact: {
    phone: string;
    phoneIntl: string;
    email: string;
    address: string;
    instagram: string;
    whatsapp: string;
  };
  shop: {
    freeShippingMin: number;
    warranty: string;
    maxInstallments: number;
    returnDays: number;
    shippingDays: string;
  };
  hero: {
    image: string;
    eyebrow: string;
    titleBefore: string;
    titleAccent: string;
    subtitle: string;
    ctaText: string;
    ctaHref: string;
  };
  announcement: string;
};

export const SETTING_KEYS = [
  "brand.name",
  "brand.tagline",
  "brand.logoUrl",
  "contact.phone",
  "contact.phoneIntl",
  "contact.email",
  "contact.address",
  "contact.instagram",
  "contact.whatsapp",
  "shop.freeShippingMin",
  "shop.warranty",
  "shop.maxInstallments",
  "shop.returnDays",
  "shop.shippingDays",
  "hero.image",
  "hero.eyebrow",
  "hero.titleBefore",
  "hero.titleAccent",
  "hero.subtitle",
  "hero.ctaText",
  "hero.ctaHref",
  "announcement",
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

function defaults(): EditableSettings {
  return {
    brand: { name: siteConfig.name, tagline: siteConfig.tagline, logoUrl: "" },
    contact: {
      phone: siteConfig.contact.phone,
      phoneIntl: siteConfig.contact.phoneIntl,
      email: siteConfig.contact.email,
      address: siteConfig.contact.address,
      instagram: siteConfig.contact.instagram,
      whatsapp: siteConfig.contact.whatsapp,
    },
    shop: {
      freeShippingMin: siteConfig.shop.freeShippingMin,
      warranty: siteConfig.shop.warranty,
      maxInstallments: siteConfig.shop.maxInstallments,
      returnDays: siteConfig.shop.returnDays,
      shippingDays: siteConfig.shop.shippingDays,
    },
    hero: {
      image: defaultHero.image,
      eyebrow: defaultHero.eyebrow,
      titleBefore: defaultHero.titleBefore,
      titleAccent: defaultHero.titleAccent,
      subtitle: defaultHero.subtitle,
      ctaText: defaultHero.ctaText,
      ctaHref: defaultHero.ctaHref,
    },
    announcement: defaultAnnouncement,
  };
}

function applyOverride(settings: EditableSettings, key: string, value: unknown) {
  const parts = key.split(".");
  let target: Record<string, unknown> = settings as unknown as Record<string, unknown>;
  for (let i = 0; i < parts.length - 1; i++) {
    const next = target[parts[i]];
    if (typeof next !== "object" || next === null) return;
    target = next as Record<string, unknown>;
  }
  target[parts[parts.length - 1]] = value;
}

/** Cached settings reader. Invalidated by `site-settings` tag on save. */
export const getSiteSettings = unstable_cache(
  async (): Promise<EditableSettings> => {
    const settings = defaults();
    const rows = await prisma.siteSetting.findMany();
    for (const r of rows) {
      applyOverride(settings, r.key, r.value);
    }
    return settings;
  },
  ["site-settings"],
  { revalidate: 300, tags: [SETTINGS_TAG] },
);

export { SETTINGS_TAG };
