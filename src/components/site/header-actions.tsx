"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, User, Heart, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/stores/cart-store";
import { useWishlist } from "@/lib/stores/wishlist-store";

export function HeaderActions() {
  const cartCount = useCart((s) => s.items.reduce((a, b) => a + b.qty, 0));
  const cartOpen = useCart((s) => s.toggle);
  const wishlistCount = useWishlist((s) => s.ids.length);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="flex items-center gap-0.5 sm:gap-1.5">
      <Link
        href="/search"
        aria-label="חיפוש"
        className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 hover:bg-brand-bg-soft transition-colors"
      >
        <Search className="w-[19px] h-[19px] stroke-[1.5]" />
      </Link>
      <Link
        href="/account"
        aria-label="חשבון"
        className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 hover:bg-brand-bg-soft transition-colors"
      >
        <User className="w-[19px] h-[19px] stroke-[1.5]" />
      </Link>
      <Link
        href="/wishlist"
        aria-label="מועדפים"
        className="relative inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 hover:bg-brand-bg-soft transition-colors"
      >
        <Heart className="w-[19px] h-[19px] stroke-[1.5]" />
        {mounted && wishlistCount > 0 && (
          <span className="absolute -top-0.5 -left-0.5 min-w-[18px] h-[18px] inline-flex items-center justify-center bg-brand-accent text-white text-[0.65rem] font-medium rounded-full px-1">
            {wishlistCount}
          </span>
        )}
      </Link>
      <button
        type="button"
        onClick={cartOpen}
        aria-label="עגלה"
        data-cart-icon
        className="relative inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 hover:bg-brand-bg-soft transition-colors"
      >
        <ShoppingBag className="w-[19px] h-[19px] stroke-[1.5]" />
        {mounted && cartCount > 0 && (
          <span className="absolute -top-0.5 -left-0.5 min-w-[18px] h-[18px] inline-flex items-center justify-center bg-brand-accent text-white text-[0.65rem] font-medium rounded-full px-1">
            {cartCount}
          </span>
        )}
      </button>
    </div>
  );
}
