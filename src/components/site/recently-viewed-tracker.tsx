"use client";

import { useEffect } from "react";
import { useRecentlyViewed, type RecentItem } from "@/lib/stores/recently-viewed-store";

/**
 * Side-effect-only component — drop into a product page to push the
 * current product onto the recently-viewed list. Renders nothing.
 */
export function RecentlyViewedTracker({ item }: { item: RecentItem }) {
  const track = useRecentlyViewed((s) => s.track);
  useEffect(() => {
    track(item);
    // We intentionally track each time the product page is viewed,
    // even on re-visit (the store dedupes by moving to front).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);
  return null;
}
