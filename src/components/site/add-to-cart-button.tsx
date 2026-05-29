"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/lib/stores/cart-store";
import { flyToCart } from "@/lib/fly-to-cart";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  product: Product;
  size?: string | null;
  qty?: number;
  /** Open the side-cart drawer after adding. Defaults to true — the
   *  Israeli fashion convention (Castro / Fox / Renuar / Terminal X /
   *  Factory54 all do this) and the drawer is where the free-shipping
   *  progress bar lives, which is our strongest upsell. Pass `false`
   *  if you specifically want a quiet add (rare). */
  openCart?: boolean;
  variant?: "primary" | "overlay";
  requireSize?: boolean;
  className?: string;
  label?: string;
  /** Optional element to fly into the cart icon. If not given we fly
   *  the button itself. The product detail page passes its big main
   *  image; product cards pass their thumbnail. */
  flySource?: React.RefObject<HTMLElement | null>;
};

export function AddToCartButton({
  product,
  size = null,
  qty = 1,
  openCart = true,
  variant = "primary",
  requireSize = false,
  className,
  label = "הוספה לעגלה",
  flySource,
}: Props) {
  const add = useCart((s) => s.add);
  const setOpen = useCart((s) => s.setOpen);
  const [busy, setBusy] = useState(false);
  const selfRef = useRef<HTMLButtonElement>(null);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (requireSize && !size) {
      toast.error("בחרו מידה לפני ההוספה לעגלה");
      return;
    }
    setBusy(true);
    // Fire the fly animation BEFORE add() so the source image is still
    // mounted in case add() triggers a re-render.
    flyToCart(flySource?.current ?? selfRef.current);
    add(product, qty, size);
    toast.success(`${product.name} נוסף לעגלה`);
    if (openCart) setOpen(true);
    setTimeout(() => setBusy(false), 350);
  }

  if (variant === "overlay") {
    return (
      <button
        ref={selfRef}
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
      ref={selfRef}
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
