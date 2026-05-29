"use client";

/**
 * Tiny dopamine hit when a product is added to the cart: a thumbnail
 * of the product image animates from where it currently lives in the
 * page to the cart icon in the header.
 *
 * Usage from a client component — always pass the clicked button. The
 * util walks up to the nearest [data-product-id] card to find a
 * [data-fly-source] image, or falls back to the first <img> in the
 * card. Falls back to flying the button itself if neither exists.
 *
 *   import { flyToCart } from "@/lib/fly-to-cart";
 *   <button onClick={(e) => { flyToCart(e.currentTarget); add(...) }}>
 *
 * Respects prefers-reduced-motion (no-op if user opted out).
 */

const REDUCED_MOTION = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const CART_TARGET_SELECTOR = "[data-cart-icon]";
const CLONE_MARKER = "data-fly-clone";

export function flyToCart(source: HTMLElement | null): void {
  if (typeof window === "undefined") return;
  if (REDUCED_MOTION()) return;
  if (!source) return;

  const cart = document.querySelector<HTMLElement>(CART_TARGET_SELECTOR);
  if (!cart) return;

  // Any in-flight cart bump animation distorts the rect — snap it back
  // to baseline so rapid clicks measure a stable destination.
  cart.getAnimations().forEach((a) => a.cancel());

  // Sweep stale clones from previous clicks (rapid clicking).
  document
    .querySelectorAll<HTMLElement>(`[${CLONE_MARKER}]`)
    .forEach((c) => c.remove());

  // Resolve the source to the actual product image. The caller passes
  // a button; we walk to the product card and find the canonical image.
  const flyEl = resolveFlyImage(source) ?? source;

  const srcRect = flyEl.getBoundingClientRect();
  if (srcRect.width === 0 || srcRect.height === 0) return;

  // Destination: center of the cart icon. We use the icon's CHILD
  // (the lucide ShoppingBag svg) when present because the cart button
  // might gain a count badge that shifts its bounding rect.
  const cartCore = (cart.querySelector("svg") as HTMLElement | null) ?? cart;
  const dstRect = cartCore.getBoundingClientRect();

  // Pull a usable image URL from the source (Next/Image renders <img>
  // with currentSrc set after load). Falls back to the source's bg.
  const imageUrl = getImageUrl(flyEl);

  // Build a fresh element rather than cloneNode — sidesteps inherited
  // Next.js inline styles (position: absolute, inset: 0, width: 100%)
  // that fight our explicit fixed positioning.
  const clone = document.createElement("div");
  clone.setAttribute(CLONE_MARKER, "");
  Object.assign(clone.style, {
    position: "fixed",
    left: `${srcRect.left}px`,
    top: `${srcRect.top}px`,
    width: `${srcRect.width}px`,
    height: `${srcRect.height}px`,
    margin: "0",
    padding: "0",
    pointerEvents: "none",
    zIndex: "9999",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 12px 30px -8px rgba(0,0,0,0.25)",
    willChange: "transform, opacity",
    backgroundColor: "var(--brand-accent, #c89968)",
    backgroundImage: imageUrl ? `url("${imageUrl}")` : "",
    backgroundSize: "cover",
    backgroundPosition: "center",
    transformOrigin: "center center",
  } as Partial<CSSStyleDeclaration>);

  document.body.appendChild(clone);

  // Center-to-center delta. Default transform-origin is the clone's
  // own center, so center-aligning before/after scale is consistent.
  const srcCenterX = srcRect.left + srcRect.width / 2;
  const srcCenterY = srcRect.top + srcRect.height / 2;
  const dstCenterX = dstRect.left + dstRect.width / 2;
  const dstCenterY = dstRect.top + dstRect.height / 2;
  const dx = dstCenterX - srcCenterX;
  const dy = dstCenterY - srcCenterY;

  const anim = clone.animate(
    [
      { transform: "translate(0, 0) scale(1)", opacity: 1 },
      {
        transform: `translate(${dx * 0.5}px, ${dy * 0.55}px) scale(0.55)`,
        opacity: 0.95,
        offset: 0.55,
      },
      {
        transform: `translate(${dx}px, ${dy}px) scale(0.08)`,
        opacity: 0,
      },
    ],
    {
      duration: 700,
      easing: "cubic-bezier(0.55, 0.05, 0.5, 0.95)",
      fill: "forwards",
    },
  );

  const cleanup = () => clone.remove();
  anim.addEventListener("finish", () => {
    cleanup();
    bumpCartIcon(cart);
  });
  anim.addEventListener("cancel", cleanup);
}

/**
 * Find the best element to use as the visual source for the fly.
 * Preference order:
 *   1. explicit [data-fly-source] inside the product card
 *   2. the first <img> inside the product card
 *   3. the source itself (the clicked button)
 */
function resolveFlyImage(source: HTMLElement): HTMLElement | null {
  const card = source.closest<HTMLElement>("[data-product-id]");
  if (!card) return null;
  const explicit = card.querySelector<HTMLElement>("[data-fly-source]");
  if (explicit) return explicit;
  const img = card.querySelector<HTMLImageElement>("img");
  return img ?? null;
}

/** Pull a usable image URL from an element — img.currentSrc, img.src,
 *  or computed background-image. */
function getImageUrl(el: HTMLElement): string | null {
  if (el instanceof HTMLImageElement) {
    return el.currentSrc || el.src || null;
  }
  const inner = el.querySelector("img") as HTMLImageElement | null;
  if (inner) return inner.currentSrc || inner.src || null;
  const bg = getComputedStyle(el).backgroundImage;
  const match = bg.match(/url\(["']?(.+?)["']?\)/);
  return match ? match[1] : null;
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
      easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    },
  );
}
