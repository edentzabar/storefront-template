import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getProductBySlug,
  getCategoryById,
  getRelatedProducts,
  getAllProductSlugs,
} from "@/lib/queries";
import { siteConfig } from "@/lib/site-config";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { ProductDetail } from "@/components/site/product-detail";
import { ProductCard } from "@/components/site/product-card";
import { RecentlyViewedTracker } from "@/components/site/recently-viewed-tracker";
import { RecentlyViewedStrip } from "@/components/site/recently-viewed-strip";

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const category = await getCategoryById(product.category);
  const title = `${product.name}`;
  const description = product.description || product.meta;
  const url = `${siteConfig.url}/product/${product.slug}`;

  return {
    title,
    description,
    keywords: [
      product.name,
      product.nameEn,
      category?.name ?? "",
      ...(siteConfig.keywords as readonly string[]),
    ],
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      images: [{ url: product.image, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [product.image],
    },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [category, related] = await Promise.all([
    getCategoryById(product.category),
    getRelatedProducts(slug, 4),
  ]);
  if (!category) notFound();

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    image: `${siteConfig.url}${product.image}`,
    category: category.name,
    brand: { "@type": "Brand", name: siteConfig.name },
    offers: {
      "@type": "Offer",
      url: `${siteConfig.url}/product/${product.slug}`,
      price: product.price,
      priceCurrency: siteConfig.currency.code,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "בית", item: siteConfig.url },
      {
        "@type": "ListItem",
        position: 2,
        name: category.name,
        item: `${siteConfig.url}/category/${category.slug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: `${siteConfig.url}/product/${product.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([productJsonLd, breadcrumbJsonLd]) }}
      />
      <Breadcrumbs
        items={[
          { label: "בית", href: "/" },
          { label: category.name, href: `/category/${category.slug}` },
          { label: product.name },
        ]}
      />
      <ProductDetail product={product} category={category} />

      {/* Side-effect: push this product onto the recently-viewed rail */}
      <RecentlyViewedTracker
        item={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          image: product.image,
        }}
      />

      {related.length > 0 && (
        <section className="border-t border-brand-border py-16 px-6 lg:px-10 bg-brand-bg">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="font-body text-xl font-normal text-center mb-10 text-brand-primary">
              מוצרים <span className="text-brand-accent">דומים</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recently-viewed rail — hides itself unless ≥2 other products
          have been visited. Excludes the current one. */}
      <RecentlyViewedStrip excludeId={product.id} />
    </>
  );
}
