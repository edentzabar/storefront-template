import { Hero } from "@/components/site/hero";
import { CategoriesGrid } from "@/components/site/categories-grid";
import { FeaturedProducts } from "@/components/site/featured-products";
import { CtaBanner } from "@/components/site/cta-banner";
import { About } from "@/components/site/about";
import { siteConfig } from "@/lib/site-config";
import { getFeaturedCategories, getFeaturedProducts } from "@/lib/queries";

export default async function HomePage() {
  const [categories, products] = await Promise.all([
    getFeaturedCategories(3),
    getFeaturedProducts(8),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/brand/logo.png`,
    description: siteConfig.description,
    address: {
      "@type": "PostalAddress",
      addressLocality: siteConfig.contact.address,
      addressCountry: "IL",
    },
    telephone: siteConfig.contact.phoneIntl,
    email: siteConfig.contact.email,
    sameAs: [siteConfig.contact.instagram],
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
