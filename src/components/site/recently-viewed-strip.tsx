"use client";

import Link from "next/link";
import Image from "next/image";
import { useRecentlyViewed } from "@/lib/stores/recently-viewed-store";
import { formatPrice } from "@/lib/format";

/**
 * Horizontal rail of products the visitor has recently viewed.
 *
 * - Hidden entirely until ≥2 items exist (one product = uninteresting).
 * - `excludeId` lets the product page hide the currently-viewed item.
 * - Mobile: horizontal swipe (no-scrollbar utility from globals.css).
 * - Desktop: 4-6 column grid.
 */
export function RecentlyViewedStrip({
  excludeId,
  title = "ראית לאחרונה",
}: {
  excludeId?: string;
  title?: string;
}) {
  const items = useRecentlyViewed((s) => s.items);
  const hydrated = useRecentlyViewed((s) => s.hydrated);
  if (!hydrated) return null;

  const visible = items.filter((i) => i.id !== excludeId);
  if (visible.length < 2) return null;

  return (
    <section
      aria-labelledby="recently-viewed-title"
      className="bg-brand-bg py-12 lg:py-14 border-t border-brand-border"
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 mb-6">
        <h2
          id="recently-viewed-title"
          className="font-display text-[1.4rem] lg:text-[1.6rem] font-medium text-brand-primary"
        >
          {title}
        </h2>
      </div>

      <div className="md:max-w-[1400px] md:mx-auto md:px-10">
        <div
          className={[
            "flex md:grid md:grid-cols-3 lg:grid-cols-6",
            "gap-3 md:gap-4",
            "overflow-x-auto md:overflow-visible no-scrollbar",
            "snap-x snap-mandatory md:snap-none",
            "px-6 md:px-0",
            "[&>*:last-child]:me-6 md:[&>*:last-child]:me-0",
          ].join(" ")}
        >
          {visible.map((p) => (
            <Link
              key={p.id}
              href={`/product/${p.slug}`}
              className="shrink-0 w-[44vw] xs:w-[42vw] sm:w-[36vw] md:w-auto snap-start no-underline group"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-brand-surface mb-2">
                {p.image && (
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    sizes="(min-width: 1024px) 16vw, (min-width: 768px) 33vw, 44vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                )}
              </div>
              <div className="px-1">
                <div className="text-[0.88rem] text-brand-primary font-medium leading-snug line-clamp-2 mb-0.5 group-hover:text-brand-accent transition-colors">
                  {p.name}
                </div>
                <div className="text-[0.85rem] text-brand-text-soft tabular-nums">
                  {formatPrice(p.price)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
