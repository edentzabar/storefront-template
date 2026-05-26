"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useWishlist } from "@/lib/stores/wishlist-store";
import { cn } from "@/lib/utils";

type Props = {
  productId: string;
  variant?: "card" | "detail" | "detail-corner";
  className?: string;
};

export function WishlistButton({ productId, variant = "card", className }: Props) {
  const active = useWishlist((s) => s.ids.includes(productId));
  const toggle = useWishlist((s) => s.toggle);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle(productId);
  }

  const isActive = mounted && active;

  if (variant === "detail-corner") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={isActive ? "הסר מהמועדפים" : "הוסף למועדפים"}
        aria-pressed={isActive}
        className={cn(
          "shrink-0 size-10 rounded-full inline-flex items-center justify-center transition-colors border",
          isActive
            ? "bg-brand-accent border-brand-accent text-white"
            : "bg-white border-brand-border text-brand-text-soft hover:border-brand-accent hover:text-brand-accent",
          className,
        )}
      >
        <Heart className={cn("size-[18px] stroke-[1.75]", isActive && "fill-current")} />
      </button>
    );
  }

  if (variant === "detail") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label="הוסף למועדפים"
        aria-pressed={isActive}
        className={cn(
          "w-12 h-14 border inline-flex items-center justify-center transition-colors",
          isActive
            ? "bg-brand-accent border-brand-accent text-white"
            : "bg-white border-brand-border text-brand-text hover:border-brand-accent hover:text-brand-accent",
          className
        )}
      >
        <Heart className={cn("w-[22px] h-[22px] stroke-[1.5]", isActive && "fill-current")} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="הוסף למועדפים"
      aria-pressed={isActive}
      className={cn(
        "absolute top-3.5 left-3.5 w-9 h-9 inline-flex items-center justify-center bg-white/92 backdrop-blur-sm hover:scale-105 transition-all z-10 rounded-full shadow-sm",
        isActive ? "bg-brand-accent text-white" : "text-brand-text-soft hover:text-brand-accent",
        className
      )}
    >
      <Heart className={cn("w-[18px] h-[18px] stroke-[1.5]", isActive && "fill-current")} />
    </button>
  );
}
