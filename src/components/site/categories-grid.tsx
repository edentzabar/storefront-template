import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import type { CategoryView } from "@/lib/queries";
import { sections } from "@/lib/data/content";
import { SectionHeader } from "./section-header";

export function CategoriesGrid({ categories }: { categories: CategoryView[] }) {
  return (
    <section
      id="categories"
      aria-labelledby="categories-title"
      className="bg-brand-bg py-20 px-6 lg:px-10"
    >
      <div className="max-w-[1400px] mx-auto">
        <SectionHeader
          eyebrow={sections.categories.eyebrow}
          title={
            <span id="categories-title">
              {sections.categories.titleBefore}
              <span className="text-brand-accent">{sections.categories.titleAccent}</span>
            </span>
          }
          subtitle={sections.categories.subtitle}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group relative aspect-[4/5] overflow-hidden bg-brand-surface no-underline"
            >
              {cat.image && (
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent transition-colors group-hover:from-black/85" />
              <div className="absolute bottom-8 right-8 left-8 text-white transition-transform duration-300 group-hover:-translate-y-1.5">
                <h3 className="font-body text-[1.8rem] font-medium leading-tight mb-2">
                  {cat.name}
                </h3>
                <span className="inline-flex items-center gap-2 text-[0.72rem] tracking-[0.3em] text-brand-accent-light uppercase">
                  {cat.cta}
                  <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
