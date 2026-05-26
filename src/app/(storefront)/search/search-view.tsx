"use client";

import { useMemo, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import type { Product, Category } from "@/lib/types";
import { ProductCard } from "@/components/site/product-card";

type Props = {
  products: Product[];
  categories: Category[];
};

export function SearchView({ products, categories }: Props) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    return products.filter((p) => {
      if (cat && p.category !== cat) return false;
      if (!query) return true;
      return (
        p.name.toLowerCase().includes(query) ||
        p.nameEn.toLowerCase().includes(query) ||
        p.meta.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    });
  }, [q, cat, products]);

  return (
    <div>
      <div className="max-w-[640px] mx-auto mb-10">
        <div className="relative">
          <SearchIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-soft" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="חפשו מוצר, קטגוריה, מק״ט…"
            autoFocus
            className="w-full pr-12 pl-4 py-4 border border-brand-border bg-white text-[1rem] focus:outline-none focus:border-brand-primary"
          />
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          <button
            onClick={() => setCat("")}
            className={`px-3 py-1.5 text-sm border transition-colors ${
              cat === "" ? "bg-brand-primary text-white border-brand-primary" : "border-brand-border hover:border-brand-text"
            }`}
          >
            הכל
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`px-3 py-1.5 text-sm border transition-colors ${
                cat === c.id ? "bg-brand-primary text-white border-brand-primary" : "border-brand-border hover:border-brand-text"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="text-sm text-brand-text-soft mb-6">
        {results.length} תוצאות{q && ` עבור "${q}"`}
      </div>

      {results.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <p className="text-center py-12 text-brand-text-soft">
          לא נמצאו תוצאות. נסו מילת חיפוש אחרת.
        </p>
      )}
    </div>
  );
}
