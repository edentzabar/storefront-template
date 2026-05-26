"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/types";
import { useWishlist } from "@/lib/stores/wishlist-store";
import { ProductCard } from "@/components/site/product-card";

export function WishlistView({ allProducts }: { allProducts: Product[] }) {
  const ids = useWishlist((s) => s.ids);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="text-center text-brand-text-soft py-12">טוען…</div>;

  const items = allProducts.filter((p) => ids.includes(p.id));

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-brand-text-soft mb-6">עוד לא הוספת מוצרים למועדפים.</p>
        <Link
          href="/"
          className="inline-block px-10 py-4 bg-brand-primary text-white text-[0.76rem] tracking-[0.2em] uppercase font-medium hover:bg-brand-primary-soft transition-colors no-underline"
        >
          לקולקציה
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
      {items.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
