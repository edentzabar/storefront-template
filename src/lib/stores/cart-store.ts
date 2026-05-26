"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product } from "@/lib/types";

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  hydrated: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  add: (product: Product, qty?: number, size?: string | null) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  changeQty: (key: string, delta: number) => void;
  clear: () => void;
  replace: (items: CartItem[]) => void;
  count: () => number;
  total: () => number;
};

function makeKey(productId: string, size: string | null | undefined) {
  return `${productId}::${size ?? "_"}`;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      hydrated: false,
      setOpen: (open) => set({ isOpen: open }),
      toggle: () => set({ isOpen: !get().isOpen }),
      add: (product, qty = 1, size = null) => {
        const key = makeKey(product.id, size);
        const items = [...get().items];
        const existing = items.find((i) => i.key === key);
        if (existing) {
          existing.qty += qty;
        } else {
          items.push({
            key,
            id: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            image: product.image,
            size: size ?? null,
            qty,
          });
        }
        set({ items });
      },
      remove: (key) => set({ items: get().items.filter((i) => i.key !== key) }),
      setQty: (key, qty) => {
        if (qty <= 0) {
          set({ items: get().items.filter((i) => i.key !== key) });
          return;
        }
        set({
          items: get().items.map((i) => (i.key === key ? { ...i, qty } : i)),
        });
      },
      changeQty: (key, delta) => {
        const item = get().items.find((i) => i.key === key);
        if (!item) return;
        get().setQty(key, item.qty + delta);
      },
      clear: () => set({ items: [] }),
      replace: (items) => set({ items }),
      count: () => get().items.reduce((s, i) => s + i.qty, 0),
      total: () => get().items.reduce((s, i) => s + i.price * i.qty, 0),
    }),
    {
      name: "app.cart",
      partialize: (s) => ({ items: s.items }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    }
  )
);
