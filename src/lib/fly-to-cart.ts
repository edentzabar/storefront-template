"use client";

/**
 * Tiny dopamine hit when a product is added to the cart: a clone of the
 * source image (or a circle fallback) animates from where the user
 * clicked to the cart icon in the header.
 *
 * Usage from a client component:
 *
 *   import { flyToCart } from "@/lib/fly-to-cart";
 *   const imgRef = useRef<HTMLImageElement>(null);
 *   ...
 *   <Image ref={imgRef} ... />
 *   <button onClick={() => { flyToCart(imgRef.current); add(...) }}>
 *
 * Respects prefers-reduced-motion (no-op if user opted out).
 */

const REDUCED_MOTION = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** CSS selector for the cart icon target. Header-actions sets data-cart-icon
 *  on the cart button. */
const CART_TARGET_SELECTOR = "[data-cart-icon]";
/** Marker on in-flight flying clones so we can clean them up before
 *  starting a new fly. Prevents the screen from littering with stuck
 *  clones if the user mashes "add to cart". */
const CLONE_MARKER = "data-fly-clone";

export function flyToCart(source: HTMLElement | null): void {
  if (typeof window === "undefined") return;
  if (REDUCED_MOTION()) return;
  if (!source) return;

  const cart = document.querySelector<HTMLElement>(CART_TARGET_SELECTOR);
  if (!cart) return;

  // Snap any in-flight cart bump back to baseline BEFORE measuring,
  // otherwise rapid clicks read the cart's rect mid-scale and the
  // destination wanders ("קופץ לכל מיני איזורים").
  cart.getAnimations().forEach((a) => a.cancel());

  // Sweep up old flying clones from previous clicks — if the user
  // clicks faster than the 700ms flight time, the previous clone is
  // still mid-air; remove it so we don't end up with a pile.
  document
    .querySelectorAll<HTMLElement>(`[${CLONE_MARKER}]`)
    .forEach((c) => c.remove());

  // If the caller handed us a button (typical for product-card overlay
  // buttons), walk up to the nearest [data-product-id] card and use its
  // image instead — much nicer to watch the actual product fly than a
  // generic button rectangle.
  if (source.tagName === "BUTTON") {
    const card = source.closest<HTMLElement>("[data-product-id]");
    const img = card?.querySelector<HTMLImageElement>("img");
    if (img) source = img;
  }

  const srcRect = source.getBoundingClientRect();
  const dstRect = cart.getBoundingClientRect();

  // Skip if source isn't on-screen (e.g., in a closed drawer)
  if (srcRect.width === 0 || srcRect.height === 0) return;

  // Build the flying clone. We use the source's <img> if it's an Image;
  // otherwise fall back to a circular brand-accent dot so it still feels
  // like SOMETHING flew, even on text-only buttons.
  const clone = source.cloneNode(true) as HTMLElement;
  clone.setAttribute(CLONE_MARKER, "");
  clone.style.position = "fixed";
  clone.style.left = `${srcRect.left}px`;
  clone.style.top = `${srcRect.top}px`;
  clone.style.width = `${srcRect.width}px`;
  clone.style.height = `${srcRect.height}px`;
  clone.style.margin = "0";
  clone.style.pointerEvents = "none";
  clone.style.zIndex = "9999";
  clone.style.borderRadius = "12px";
  clone.style.overflow = "hidden";
  clone.style.boxShadow = "0 12px 30px -8px rgba(0,0,0,0.25)";
  clone.style.willChange = "transform, opacity";
  // Match the source's object-fit so the cloned image doesn't suddenly
  // stretch differently mid-flight.
  const innerImg = clone.querySelector("img");
  if (innerImg) {
    (innerImg as HTMLImageElement).style.objectFit = "cover";
    (innerImg as HTMLImageElement).style.width = "100%";
    (innerImg as HTMLImageElement).style.height = "100%";
  }
  document.body.appendChild(clone);

  // Destination: the center of the cart icon
  const dstX = dstRect.left + dstRect.width / 2 - srcRect.left - srcRect.width / 2;
  const dstY = dstRect.top + dstRect.height / 2 - srcRect.top - srcRect.height / 2;

  // Animation — start big, finish tiny at the cart icon
  const anim = clone.animate(
    [
      { transform: "translate(0, 0) scale(1)", opacity: 1 },
      {
        transform: `translate(${dstX * 0.5}px, ${dstY * 0.55}px) scale(0.55)`,
        opacity: 0.95,
        offset: 0.55,
      },
      {
        transform: `translate(${dstX}px, ${dstY}px) scale(0.08)`,
        opacity: 0,
      },
    ],
    {
      duration: 700,
      easing: "cubic-bezier(0.55, 0.05, 0.5, 0.95)",
    },
  );
  anim.addEventListener("finish", () => {
    clone.remove();
    bumpCartIcon(cart);
  });
  // Safety — remove the clone even if animation is interrupted
  anim.addEventListener("cancel", () => clone.remove());
}

/** Small bounce on the cart icon when something lands in it. */
function bumpCartIcon(cart: HTMLElement) {
  cart.animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(1.25)" },
      { transform: "scale(0.95)" },
      { transform: "scale(1)" },
    ],
    {
      duration: 350,
      easing: "cubic-bezier(0.34, 1.56, 0.64, 1)", // back-out for satisfying snap
    },
  );
}
