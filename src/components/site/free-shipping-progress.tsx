"use client";

import { useCart } from "@/lib/stores/cart-store";
import { useShopSettings } from "@/components/site/shop-settings-provider";
import { formatPrice } from "@/lib/format";

/**
 * Free-shipping progress bar shown above the cart items (both in the
 * drawer and on the full /cart page). Reads the threshold from the
 * shop-settings context, which is populated from /admin/settings —
 * so when the merchant edits "משלוח חינם מעל", this bar updates
 * automatically (cache invalidates on save). Hidden entirely when
 * the threshold is 0 / falsy.
 *
 * A small detail that lifts AOV significantly in the field — shoppers
 * naturally bump their cart over the line to unlock free shipping.
 */
export function FreeShippingProgress() {
  const items = useCart((s) => s.items);
  const hydrated = useCart((s) => s.hydrated);
  const { freeShippingMin: threshold } = useShopSettings();
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  if (!threshold || threshold <= 0) return null;

  // Avoid SSR/CSR mismatch — show neutral state until hydrated.
  if (!hydrated) {
    return (
      <div className="px-5 py-3.5 bg-brand-bg-soft border-b border-brand-border" />
    );
  }

  const remaining = Math.max(0, threshold - total);
  const pct = Math.min(100, Math.round((total / threshold) * 100));
  const unlocked = remaining === 0 && total > 0;

  return (
    <div className="px-5 py-3.5 bg-brand-bg-soft border-b border-brand-border">
      <div className="flex items-center justify-between text-[0.82rem] mb-1.5">
        {unlocked ? (
          <span className="font-medium text-brand-accent inline-flex items-center gap-1.5">
            <span aria-hidden>🎉</span>
            קיבלת משלוח חינם!
          </span>
        ) : total === 0 ? (
          <span className="text-brand-text-soft">
            משלוח חינם בהזמנות מעל {formatPrice(threshold)}
          </span>
        ) : (
          <span className="text-brand-text">
            עוד <strong className="text-brand-primary tabular-nums">{formatPrice(remaining)}</strong>{" "}
            ויש לך משלוח חינם 🎁
          </span>
        )}
        {!unlocked && total > 0 && (
          <span className="text-[10px] text-brand-text-soft tabular-nums">{pct}%</span>
        )}
      </div>
      <div className="h-1.5 bg-brand-border/60 rounded-full overflow-hidden">
        <div
          className={[
            "h-full rounded-full transition-[width] duration-500 ease-out",
            unlocked ? "bg-brand-accent" : "bg-brand-accent-light",
          ].join(" ")}
          style={{ width: `${unlocked ? 100 : pct}%` }}
        />
      </div>
    </div>
  );
}
