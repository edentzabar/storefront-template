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
  /**
   * - `primary`: full-width bar — product detail page.
   * - `overlay`: bottom-of-image bar revealed on hover — desktop card
   *   listings. Useless on mobile (no hover).
   * - `compact`: small text pill with bag icon, anchored to the
   *   bottom-right corner of the card image. Always visible —
   *   designed for mobile card listings where hover isn't available.
   */
  variant?: "primary" | "overlay" | "compact";
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
    // Skip the fly on the mobile detail page: the source image is
    // huge, the user has scrolled past it, and even with the button
    // fallback the animation feels off in that specific layout. On
    // every other surface (card listings, desktop detail) the fly
    // still runs and feels great.
    const skipFly =
      variant === "primary" &&
      typeof window !== "undefined" &&
      window.innerWidth < 768;
    if (!skipFly) {
      // Wait for the fly to land before opening the drawer. Without
      // this, mobile users never see the animation — the drawer
      // slides over it within the first frame.
      await flyToCart(flySource?.current ?? selfRef.current);
    }
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

  if (variant === "compact") {
    return (
      <button
        ref={selfRef}
        type="button"
        onClick={handleClick}
        disabled={busy}
        aria-label={label}
        className={cn(
          // Centered at the bottom of the card image. Translucent
          // brand-primary + backdrop-blur matches the badge aesthetic
          // ("אזל המלאי" etc.) so the button doesn't visually shout
          // over the product photo.
          //
          // No icon: text + icon was overflowing onto a second line
          // on small phones (≤375px in a 2-col grid). Text alone
          // stays on one line with whitespace-nowrap and is clearer
          // anyway — the pill shape already signals "tap me".
          //
          // cursor-pointer because Tailwind's reset sets buttons to
          // cursor:default by default, which made the pill feel
          // non-interactive next to the image (which IS pointer).
          "absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center justify-center px-4 min-h-11 bg-brand-primary/85 backdrop-blur-sm text-white rounded-full active:scale-95 transition-transform z-10 text-sm font-medium cursor-pointer whitespace-nowrap",
          className,
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
