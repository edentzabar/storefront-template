"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Cookie / tracking consent state.
 *
 * Israeli Privacy Protection Law + 2022 court ruling: consent must be
 * ACTIVE (a click), not passive (scrolling). Until the visitor opts in,
 * we must not load analytics / marketing tracking. Essential cookies
 * (session, cart, language) are always allowed without consent because
 * they are required for the site to function.
 *
 * `status === "pending"` means the banner should be shown.
 * `status === "accepted"` means the visitor made a choice (could be
 * "all" or "essential-only"); we DON'T show the banner again unless
 * they explicitly reset via /privacy.
 *
 * To gate optional trackers throughout the codebase:
 *   const { analytics } = useCookieConsent();
 *   if (analytics) <GoogleAnalyticsScript />
 */

export type CookieCategories = {
  /** Cart / session / authentication / language. Always true. */
  essential: true;
  /** Google Analytics, Hotjar, etc. */
  analytics: boolean;
  /** Facebook Pixel, Google Ads conversion tracking, etc. */
  marketing: boolean;
};

type CookieConsentState = {
  status: "pending" | "accepted";
  categories: CookieCategories;
  acceptAll: () => void;
  rejectOptional: () => void;
  saveCustom: (cats: { analytics: boolean; marketing: boolean }) => void;
  reset: () => void;
};

const DEFAULT_CATEGORIES: CookieCategories = {
  essential: true,
  analytics: false,
  marketing: false,
};

export const useCookieConsent = create<CookieConsentState>()(
  persist(
    (set) => ({
      status: "pending",
      categories: DEFAULT_CATEGORIES,
      acceptAll: () =>
        set({
          status: "accepted",
          categories: { essential: true, analytics: true, marketing: true },
        }),
      rejectOptional: () =>
        set({
          status: "accepted",
          categories: { ...DEFAULT_CATEGORIES },
        }),
      saveCustom: (cats) =>
        set({
          status: "accepted",
          categories: { essential: true, ...cats },
        }),
      // Used by /privacy "review your cookie preferences" link.
      reset: () =>
        set({ status: "pending", categories: { ...DEFAULT_CATEGORIES } }),
    }),
    {
      name: "jc-cookie-consent",
      // Only persist what we need; don't accidentally serialize functions.
      partialize: (state) => ({
        status: state.status,
        categories: state.categories,
      }),
    },
  ),
);
