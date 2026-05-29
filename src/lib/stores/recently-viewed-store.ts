"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Recently viewed products — last N products the visitor opened.
 *
 * We persist full product snapshots (not just ids) so the strip can
 * render instantly without an extra round-trip to the server. Trade-off
 * is mild data staleness (renamed / re-priced products show their old
 * snapshot until the user views them again). For a "recently viewed"
 * UI that's acceptable.
 */

export type RecentItem = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
};

const MAX_ITEMS = 8;

type State = {
  items: RecentItem[];
  hydrated: boolean;
  track: (item: RecentItem) => void;
  clear: () => void;
};

export const useRecentlyViewed = create<State>()(
  persist(
    (set, get) => ({
      items: [],
      hydrated: false,
      track: (item) => {
        // Move to front, dedupe by id, cap at MAX_ITEMS
        const others = get().items.filter((x) => x.id !== item.id);
        set({ items: [item, ...others].slice(0, MAX_ITEMS) });
      },
      clear: () => set({ items: [] }),
    }),
    {
      name: "app.recently-viewed",
      partialize: (s) => ({ items: s.items }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
