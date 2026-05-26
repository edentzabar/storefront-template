import Link from "next/link";
import type { ProductView } from "@/lib/queries";
import { sections } from "@/lib/data/content";
import { SectionHeader } from "./section-header";
import { ProductCard } from "./product-card";

export function FeaturedProducts({ products }: { products: ProductView[] }) {
  return (
    <section
      id="products"
      aria-labelledby="products-title"
      className="bg-brand-surface py-20 px-6 lg:px-10"
    >
      <div className="max-w-[1400px] mx-auto">
        <SectionHeader
          eyebrow={sections.products.eyebrow}
          title={
            <span id="products-title">
              {sections.products.titleBefore}
              <span className="text-brand-accent">{sections.products.titleAccent}</span>
              {sections.products.titleAfter}
            </span>
          }
          subtitle={sections.products.subtitle}
        />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 mt-12">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        <div className="text-center mt-14">
          <Link
            href={sections.products.ctaHref}
            className="inline-block px-10 py-4 bg-brand-primary text-white text-[0.76rem] tracking-[0.2em] uppercase font-medium border border-brand-primary hover:bg-transparent hover:text-brand-primary transition-colors duration-300 no-underline"
          >
            {sections.products.ctaText}
          </Link>
        </div>
      </div>
    </section>
  );
}
