"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/site/product-card";

type SortOption = "featured" | "price-asc" | "price-desc" | "newest";

export function CategoryGrid({ products }: { products: Product[] }) {
  const [sort, setSort] = useState<SortOption>("featured");
  const [onlySale, setOnlySale] = useState(false);

  const filtered = useMemo(() => {
    let list = products;
    if (onlySale) list = list.filter((p) => p.originalPrice != null);
    switch (sort) {
      case "price-asc":
        return [...list].sort((a, b) => a.price - b.price);
      case "price-desc":
        return [...list].sort((a, b) => b.price - a.price);
      case "newest":
        return [...list].sort((a, b) => (b.badge === "חדש" ? 1 : 0) - (a.badge === "חדש" ? 1 : 0));
      default:
        return list;
    }
  }, [products, sort, onlySale]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 pb-6 mb-8 border-b border-brand-border">
        <div className="flex items-center gap-4">
          <span className="text-sm text-brand-text-soft">{filtered.length} מוצרים</span>
          <label className="flex items-center gap-2 text-sm cursor-pointer text-brand-text">
            <input
              type="checkbox"
              checked={onlySale}
              onChange={(e) => setOnlySale(e.target.checked)}
              className="accent-brand-accent"
            />
            במבצע בלבד
          </label>
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          aria-label="מיון"
          className="text-sm bg-white border border-brand-border px-3 py-2 cursor-pointer"
        >
          <option value="featured">מומלצים</option>
          <option value="price-asc">מחיר: נמוך לגבוה</option>
          <option value="price-desc">מחיר: גבוה לנמוך</option>
          <option value="newest">חדשים</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-brand-text-soft">
          לא נמצאו מוצרים תואמים.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </>
  );
}
