"use client";

import { createContext, useContext } from "react";

/**
 * Shop-policy settings that need to reach client components
 * (free-shipping bar in the cart drawer, checkout shipping cost,
 * product-detail "free shipping over X" copy). The provider is
 * mounted once in the storefront layout with values pulled from
 * `getSiteSettings()` so the admin's edits propagate to every
 * pricing surface without each page fetching its own copy.
 */
export type ShopSettingsValue = {
  freeShippingMin: number;
  shippingDays: string;
  warranty: string;
  returnDays: number;
};

const ShopSettingsContext = createContext<ShopSettingsValue | null>(null);

export function ShopSettingsProvider({
  value,
  children,
}: {
  value: ShopSettingsValue;
  children: React.ReactNode;
}) {
  return (
    <ShopSettingsContext.Provider value={value}>
      {children}
    </ShopSettingsContext.Provider>
  );
}

export function useShopSettings(): ShopSettingsValue {
  const ctx = useContext(ShopSettingsContext);
  if (!ctx) {
    // Defensive default so missing provider doesn't break the cart.
    // In production this should never trigger — the storefront layout
    // always wraps with a provider.
    return { freeShippingMin: 0, shippingDays: "", warranty: "", returnDays: 14 };
  }
  return ctx;
}
