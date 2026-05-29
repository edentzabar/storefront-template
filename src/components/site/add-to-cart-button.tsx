"use client";

import { useRef, useState } from "react";
import { ShoppingBag } from "lucide-react";
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
  /**
   * - `primary`: full-width bar — product detail page.
   * - `overlay`: bottom-of-image bar revealed on hover — desktop card
   *   listings. Useless on mobile (no hover).
   * - `icon`: small circular bag button in the corner — always
   *   visible, optimized for mobile card listings.
   */
  variant?: "primary" | "overlay" | "icon";
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

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (requireSize && !size) {
      toast.error("בחרו מידה לפני ההוספה לעגלה");
      return;
    }
    setBusy(true);
    // Add immediately — the cart-count badge ticks up while the clone
    // is still mid-flight, which makes the landing feel like cause +
    // effect ("I see it arriving AND I see the counter go up").
    add(product, qty, size);
    toast.success(`${product.name} נוסף לעגלה`);
    // Wait for the fly to land before opening the drawer. Without
    // this, mobile users never see the animation — the drawer slides
    // over it within the first frame.
    await flyToCart(flySource?.current ?? selfRef.current);
    if (openCart) setOpen(true);
    setBusy(false);
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

  if (variant === "icon") {
    return (
      <button
        ref={selfRef}
        type="button"
        onClick={handleClick}
        disabled={busy}
        aria-label={label}
        className={cn(
          // 44px hit target = Apple HIG minimum. bottom-right matches
          // the natural "primary action" spot in RTL Hebrew reading
          // (wishlist at top-left is the secondary save action).
          "absolute bottom-3 right-3 w-11 h-11 inline-flex items-center justify-center bg-brand-primary text-white rounded-full shadow-md active:scale-90 transition-transform z-10",
          className,
        )}
      >
        <ShoppingBag className="w-[18px] h-[18px] stroke-[1.75]" />
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
