"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useCart } from "@/lib/stores/cart-store";

type RecoveredItem = {
  id: string;
  slug: string;
  name: string;
  image: string;
  size: string | null;
  price: number;
  qty: number;
};

/**
 * Detects ?recover=TOKEN on the cart page, fetches the saved cart from
 * the recovery API, replaces the current cart contents, and strips the
 * param from the URL. Idempotent — only runs once per token.
 */
export function CartRecovery() {
  const router = useRouter();
  const params = useSearchParams();
  const replace = useCart((s) => s.replace);
  const hydrated = useCart((s) => s.hydrated);
  const handled = useRef<string | null>(null);

  useEffect(() => {
    const token = params.get("recover");
    if (!token || !hydrated) return;
    if (handled.current === token) return;
    handled.current = token;

    (async () => {
      try {
        const res = await fetch(`/api/cart/recover?token=${encodeURIComponent(token)}`);
        if (!res.ok) {
          toast.error("הקישור פג תוקף או שכבר השתמשת בו");
          return;
        }
        const data = (await res.json()) as { items: RecoveredItem[] };
        const items = data.items.map((it) => ({
          key: `${it.id}::${it.size ?? "_"}`,
          id: it.id,
          slug: it.slug,
          name: it.name,
          price: it.price,
          image: it.image,
          size: it.size,
          qty: it.qty,
        }));
        replace(items);
        toast.success("העגלה שלך שוחזרה");
      } catch {
        toast.error("שגיאה בשחזור העגלה");
      } finally {
        // Strip the param from the URL so it doesn't run again on refresh
        const next = new URLSearchParams(params);
        next.delete("recover");
        const qs = next.toString();
        router.replace(qs ? `/cart?${qs}` : "/cart", { scroll: false });
      }
    })();
  }, [params, hydrated, replace, router]);

  return null;
}
