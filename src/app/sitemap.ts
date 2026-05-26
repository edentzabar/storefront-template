import type { MetadataRoute } from "next";
import { getAllProductSlugs, getAllCategorySlugs } from "@/lib/queries";
import { siteConfig } from "@/lib/site-config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const now = new Date();

  const staticPages = [
    { url: base, priority: 1.0, changeFrequency: "weekly" as const },
    { url: `${base}/shop`, priority: 0.9, changeFrequency: "weekly" as const },
    { url: `${base}/sale`, priority: 0.9, changeFrequency: "weekly" as const },
    { url: `${base}/about`, priority: 0.5, changeFrequency: "monthly" as const },
    { url: `${base}/contact`, priority: 0.5, changeFrequency: "monthly" as const },
    { url: `${base}/faq`, priority: 0.5, changeFrequency: "monthly" as const },
    { url: `${base}/shipping`, priority: 0.4, changeFrequency: "yearly" as const },
    { url: `${base}/returns`, priority: 0.4, changeFrequency: "yearly" as const },
    { url: `${base}/privacy`, priority: 0.3, changeFrequency: "yearly" as const },
    { url: `${base}/terms`, priority: 0.3, changeFrequency: "yearly" as const },
    { url: `${base}/size-guide`, priority: 0.4, changeFrequency: "yearly" as const },
  ];

  const [productSlugs, categorySlugs] = await Promise.all([
    getAllProductSlugs(),
    getAllCategorySlugs(),
  ]);

  const categoryPages = categorySlugs.map((slug) => ({
    url: `${base}/category/${slug}`,
    lastModified: now,
    priority: 0.7,
    changeFrequency: "weekly" as const,
  }));

  const productPages = productSlugs.map((slug) => ({
    url: `${base}/product/${slug}`,
    lastModified: now,
    priority: 0.8,
    changeFrequency: "weekly" as const,
  }));

  return [
    ...staticPages.map((p) => ({ ...p, lastModified: now })),
    ...categoryPages,
    ...productPages,
  ];
}
