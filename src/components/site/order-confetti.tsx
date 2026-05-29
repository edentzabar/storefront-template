"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

/**
 * Side-effect-only component — bursts brand-tinted confetti when the
 * order confirmation page mounts. Respects prefers-reduced-motion.
 * Renders nothing.
 *
 * Drop into /checkout/confirmation/[id]/page.tsx.
 */
export function OrderConfetti() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Brand-tinted palette — pulls from the same CSS variables that
    // drive the theme. Defaults if --brand-* haven't been set.
    const palette = readBrandPalette();

    // Three quick bursts from slightly different angles for a fuller
    // celebration. Total ~1.5s.
    const fire = (originX: number, angle: number, scalar = 1) =>
      confetti({
        particleCount: Math.floor(80 * scalar),
        angle,
        spread: 70,
        startVelocity: 45,
        origin: { x: originX, y: 0.65 },
        colors: palette,
        scalar,
        ticks: 200,
      });

    fire(0.5, 90, 1.1); // big center burst
    setTimeout(() => fire(0.2, 60, 0.9), 180); // from the left
    setTimeout(() => fire(0.8, 120, 0.9), 360); // from the right
  }, []);

  return null;
}

function readBrandPalette(): string[] {
  if (typeof window === "undefined") return ["#c89968", "#d9b685", "#a88858"];
  const root = getComputedStyle(document.documentElement);
  const fromVar = (name: string, fallback: string) => {
    const v = root.getPropertyValue(name).trim();
    return v || fallback;
  };
  return [
    fromVar("--brand-accent", "#c89968"),
    fromVar("--brand-accent-light", "#d9b685"),
    fromVar("--brand-accent-dark", "#a88858"),
    // a couple of neutral cream / off-white sparkles
    "#ffffff",
    fromVar("--brand-bg-soft", "#f5f0e6"),
  ];
}
