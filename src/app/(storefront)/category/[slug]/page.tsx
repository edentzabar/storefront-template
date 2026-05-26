import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import {
  getCategoryBySlug,
  getProductsByCategoryId,
  getAllCategorySlugs,
} from "@/lib/queries";
import { siteConfig } from "@/lib/site-config";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { CategoryGrid } from "./category-grid";

export async function generateStaticParams() {
  const slugs = await getAllCategorySlugs();
  return slugs.map((slug) => ({ slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};

  const url = `${siteConfig.url}/category/${category.slug}`;
  return {
    title: category.seoTitle.replace(` | ${siteConfig.name}`, ""),
    description: category.seoDescription,
    keywords: [category.name, category.nameEn, ...(siteConfig.keywords as readonly string[])],
    alternates: { canonical: url },
    openGraph: {
      title: category.seoTitle,
      description: category.seoDescription,
      url,
      images: category.image ? [{ url: category.image }] : [],
    },
  };
}

export default async function CategoryPage({ params }: Params) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const products = await getProductsByCategoryId(category.id);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: category.name,
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${siteConfig.url}/product/${p.slug}`,
      name: p.name,
    })),
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
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([itemListJsonLd, breadcrumbJsonLd]) }}
      />
      <Breadcrumbs items={[{ label: "בית", href: "/" }, { label: category.name }]} />

      <header className="relative min-h-[320px] text-white text-center bg-brand-primary py-12 lg:py-20 px-6 lg:px-10 flex items-center justify-center overflow-hidden">
        {category.image && (
          <>
            <Image src={category.image} alt="" fill priority sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-black/50" />
          </>
        )}
        <div className="relative z-10 max-w-[640px] mx-auto">
          <div className="text-[0.78rem] tracking-[0.4em] uppercase text-brand-accent-light mb-4">
            {category.nameEn}
          </div>
          <h1 className="font-body text-[clamp(2rem,4.5vw,3.4rem)] font-light mb-4 tracking-wide">
            {category.name}
          </h1>
          <p className="max-w-[600px] mx-auto leading-relaxed text-white/90 font-light">
            {category.description}
          </p>
        </div>
      </header>

      <main className="py-12 lg:py-16 px-6 lg:px-10">
        <div className="max-w-[1400px] mx-auto">
          <CategoryGrid products={products} />
        </div>
      </main>
    </>
  );
}
