import { Hero } from "@/components/site/hero";
import { CategoriesGrid } from "@/components/site/categories-grid";
import { FeaturedProducts } from "@/components/site/featured-products";
import { CtaBanner } from "@/components/site/cta-banner";
import { About } from "@/components/site/about";
import { siteConfig } from "@/lib/site-config";
import { getSiteSettings } from "@/lib/site-settings";
import { getFeaturedCategories, getFeaturedProducts } from "@/lib/queries";
import { telHref } from "@/lib/format";

export default async function HomePage() {
  const [categories, products, settings] = await Promise.all([
    getFeaturedCategories(3),
    getFeaturedProducts(8),
    getSiteSettings(),
  ]);

  // Strip the "tel:" prefix that telHref adds — schema.org wants the
  // plain E.164 number.
  const telephone = telHref(settings.contact.phone).replace(/^tel:/, "");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: settings.brand.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/brand/logo.png`,
    description: siteConfig.description,
    address: {
      "@type": "PostalAddress",
      addressLocality: settings.contact.address,
      addressCountry: "IL",
    },
    telephone,
    email: settings.contact.email,
    sameAs: [settings.contact.instagram],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <CategoriesGrid categories={categories} />
      <FeaturedProducts products={products} />
      <CtaBanner />
      <About />
    </>
  );
}
