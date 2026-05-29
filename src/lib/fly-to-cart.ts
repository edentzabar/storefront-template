"use client";

/**
 * Game-style add-to-cart animation:
 *
 *   1. Anticipation — the clone "squats" briefly (scaleY > scaleX) and
 *      tilts counter to its spin direction, like loading a slingshot.
 *   2. Arc flight — sampled along a sine-curve parabola, so the item
 *      actually lifts before landing instead of going in a straight
 *      line. 1.5 full spins for playful tumble.
 *   3. Impact squash — horizontal squash + opacity fade in the final
 *      4% of the timeline, the visual equivalent of "smack".
 *   4. Cart bump + ring pulse — the icon overshoots scale 1.45x with
 *      a slight rotation, and a brand-accent ring expands and fades
 *      from the icon center (drop-in-water ripple).
 *
 * Returns a Promise that resolves when the clone arrives at the cart
 * — the caller awaits it before opening the cart drawer so the
 * animation isn't masked by an immediate full-screen sheet on mobile.
 *
 * Respects prefers-reduced-motion (resolves immediately).
 */

const REDUCED_MOTION = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const CART_TARGET_SELECTOR = "[data-cart-icon]";
const CLONE_MARKER = "data-fly-clone";

/** Total flight duration. Long enough to enjoy the arc, short enough
 *  not to feel sluggish on mobile. */
const FLIGHT_MS = 650;

export function flyToCart(source: HTMLElement | null): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !source || REDUCED_MOTION()) {
      resolve();
      return;
    }

    const cart = document.querySelector<HTMLElement>(CART_TARGET_SELECTOR);
    if (!cart) {
      resolve();
      return;
    }

    // Snap any in-flight cart bump back to baseline so rapid clicks
    // measure the cart's resting rect.
    cart.getAnimations().forEach((a) => a.cancel());

    // Sweep stale clones from previous rapid clicks.
    document
      .querySelectorAll<HTMLElement>(`[${CLONE_MARKER}]`)
      .forEach((c) => c.remove());

    const flyEl = resolveFlyImage(source) ?? source;

    const srcRect = flyEl.getBoundingClientRect();
    if (srcRect.width === 0 || srcRect.height === 0) {
      resolve();
      return;
    }

    // Measure from the cart's inner svg — the count badge grows the
    // button's outer rect when the first item lands.
    const cartCore = (cart.querySelector("svg") as HTMLElement | null) ?? cart;
    const dstRect = cartCore.getBoundingClientRect();

    const imageUrl = getImageUrl(flyEl);

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
      boxShadow: "0 14px 35px -10px rgba(0,0,0,0.35)",
      willChange: "transform, opacity",
      backgroundColor: "var(--brand-accent, #c89968)",
      backgroundImage: imageUrl ? `url("${imageUrl}")` : "",
      backgroundSize: "cover",
      backgroundPosition: "center",
      transformOrigin: "center center",
    } as Partial<CSSStyleDeclaration>);

    document.body.appendChild(clone);

    const dx = dstRect.left + dstRect.width / 2 - (srcRect.left + srcRect.width / 2);
    const dy = dstRect.top + dstRect.height / 2 - (srcRect.top + srcRect.height / 2);

    const keyframes = buildFlightKeyframes(dx, dy);

    const anim = clone.animate(keyframes, {
      duration: FLIGHT_MS,
      // Linear at the timeline level — the keyframes themselves are
      // sampled along the arc, so per-segment easing would distort it.
      easing: "linear",
      fill: "forwards",
    });

    const cleanup = () => clone.remove();
    anim.addEventListener("finish", () => {
      cleanup();
      bumpCartIcon(cart);
      ringPulse(cartCore.getBoundingClientRect());
      resolve();
    });
    anim.addEventListener("cancel", () => {
      cleanup();
      resolve();
    });
  });
}

/**
 * Build the keyframe list for the flight. Three phases:
 *   - Anticipation (offset 0 → 0.12): squat + counter-tilt
 *   - Arc (offset 0.15 → 0.92): sampled sine-curve parabola + spin
 *   - Impact (offset 0.96 → 1): horizontal squash + fade
 */
function buildFlightKeyframes(dx: number, dy: number): Keyframe[] {
  const distance = Math.hypot(dx, dy);
  // Lift higher for longer flights so it stays a real arc, not a hop.
  const arcLift = Math.max(110, distance * 0.28);
  // 1.5 full spins — playful tumble without being dizzying. Direction
  // matches horizontal motion so it feels like the item is rolling
  // toward the cart.
  const spinDeg = 540 * (dx >= 0 ? 1 : -1);

  const frames: Keyframe[] = [];

  // Anticipation: squat (wider, shorter), tilt opposite to spin
  frames.push({
    transform: "translate(0, 0) scale(1, 1) rotate(0deg)",
    opacity: 1,
    offset: 0,
  });
  frames.push({
    transform: `translate(0, 10px) scale(1.18, 0.82) rotate(${-spinDeg * 0.04}deg)`,
    opacity: 1,
    offset: 0.1,
  });

  // Arc flight — sample 10 points along a sine parabola
  const STEPS = 10;
  for (let i = 1; i <= STEPS; i++) {
    const t = i / STEPS;
    // Map local t (0..1) into the global 0.15..0.92 window
    const globalT = 0.15 + t * 0.77;

    const x = dx * t;
    const lift = -arcLift * Math.sin(Math.PI * t);
    const y = dy * t + lift;

    // Uniform scale during flight (1.1 → 0.22)
    const s = 1.1 - t * 0.88;
    const rot = t * spinDeg;

    frames.push({
      transform: `translate(${x}px, ${y}px) scale(${s}, ${s}) rotate(${rot}deg)`,
      opacity: 1,
      offset: globalT,
    });
  }

  // Impact: horizontal squash like hitting a wall, start fading
  frames.push({
    transform: `translate(${dx}px, ${dy}px) scale(0.32, 0.16) rotate(${spinDeg}deg)`,
    opacity: 0.75,
    offset: 0.96,
  });
  frames.push({
    transform: `translate(${dx}px, ${dy}px) scale(0.05, 0.05) rotate(${spinDeg}deg)`,
    opacity: 0,
    offset: 1,
  });

  return frames;
}

/**
 * Find the best element to use as the visual source for the fly.
 * Preference: [data-fly-source] > first <img> > the source itself.
 */
function resolveFlyImage(source: HTMLElement): HTMLElement | null {
  const card = source.closest<HTMLElement>("[data-product-id]");
  if (!card) return null;
  const explicit = card.querySelector<HTMLElement>("[data-fly-source]");
  if (explicit) return explicit;
  const img = card.querySelector<HTMLImageElement>("img");
  return img ?? null;
}

/** Pull a usable image URL from an element. */
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

/**
 * Bigger, snappier cart bump on impact. Overshoots, recovers, settles
 * — the back-out easing makes the overshoot feel intentional and
 * satisfying (12-principles "follow-through").
 */
function bumpCartIcon(cart: HTMLElement) {
  cart.animate(
    [
      { transform: "scale(1) rotate(0deg)" },
      { transform: "scale(1.45) rotate(-10deg)" },
      { transform: "scale(0.82) rotate(7deg)" },
      { transform: "scale(1.15) rotate(-3deg)" },
      { transform: "scale(1) rotate(0deg)" },
    ],
    {
      duration: 480,
      easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    },
  );
}

/**
 * Brand-accent ring expanding outward from the cart center, like a
 * drop hitting water. Reinforces the "the item LANDED here" feeling
 * — works even on mobile where the bump might be subtle on a small
 * icon. ~500ms, then cleans itself up.
 */
function ringPulse(cartRect: DOMRect) {
  const cx = cartRect.left + cartRect.width / 2;
  const cy = cartRect.top + cartRect.height / 2;
  const startSize = 26;

  const ring = document.createElement("div");
  ring.setAttribute(CLONE_MARKER, ""); // co-opt cleanup
  Object.assign(ring.style, {
    position: "fixed",
    left: `${cx - startSize / 2}px`,
    top: `${cy - startSize / 2}px`,
    width: `${startSize}px`,
    height: `${startSize}px`,
    borderRadius: "50%",
    border: "2px solid var(--brand-accent, #c89968)",
    pointerEvents: "none",
    zIndex: "9998",
    boxSizing: "border-box",
    willChange: "transform, opacity",
  } as Partial<CSSStyleDeclaration>);
  document.body.appendChild(ring);

  const anim = ring.animate(
    [
      { transform: "scale(1)", opacity: 1 },
      { transform: "scale(3.6)", opacity: 0 },
    ],
    {
      duration: 520,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)", // ease-out — fast start, slow finish
      fill: "forwards",
    },
  );
  anim.addEventListener("finish", () => ring.remove());
  anim.addEventListener("cancel", () => ring.remove());
}
