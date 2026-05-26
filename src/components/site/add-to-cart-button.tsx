"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/lib/stores/cart-store";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  product: Product;
  size?: string | null;
  qty?: number;
  openCart?: boolean;
  variant?: "primary" | "overlay";
  requireSize?: boolean;
  className?: string;
  label?: string;
};

export function AddToCartButton({
  product,
  size = null,
  qty = 1,
  openCart = false,
  variant = "primary",
  requireSize = false,
  className,
  label = "הוספה לעגלה",
}: Props) {
  const add = useCart((s) => s.add);
  const setOpen = useCart((s) => s.setOpen);
  const [busy, setBusy] = useState(false);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (requireSize && !size) {
      toast.error("בחרו מידה לפני ההוספה לעגלה");
      return;
    }
    setBusy(true);
    add(product, qty, size);
    toast.success(`${product.name} נוסף לעגלה`);
    if (openCart) setOpen(true);
    setTimeout(() => setBusy(false), 350);
  }

  if (variant === "overlay") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className={cn(
          "absolute bottom-0 left-0 right-0 px-4 py-3.5 bg-brand-primary/90 backdrop-blur-sm text-white text-[0.72rem] tracking-[0.2em] uppercase font-medium translate-y-full group-hover:translate-y-0 transition-transform duration-400 ease-out",
          className
        )}
      >
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className={cn(
        "flex-1 bg-brand-primary text-white border border-brand-primary py-4 px-8 text-[0.78rem] tracking-[0.2em] uppercase font-medium hover:bg-brand-primary-soft transition-colors disabled:opacity-60",
        className
      )}
    >
      {label}
    </button>
  );
}
