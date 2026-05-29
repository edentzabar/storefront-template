"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/lib/stores/cart-store";
import { formatPrice } from "@/lib/format";
import { siteConfig } from "@/lib/site-config";
import { FreeShippingProgress } from "@/components/site/free-shipping-progress";

export function CartView() {
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.total());
  const remove = useCart((s) => s.remove);
  const changeQty = useCart((s) => s.changeQty);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="text-center py-16 text-brand-text-soft">טוען…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-brand-text-soft mb-6">העגלה ריקה</p>
        <Link
          href="/"
          className="inline-block px-10 py-4 bg-brand-primary text-white text-[0.76rem] tracking-[0.2em] uppercase font-medium border border-brand-primary hover:bg-transparent hover:text-brand-primary transition-colors no-underline"
        >
          המשך לקנייה
        </Link>
      </div>
    );
  }

  const shippingNote =
    total >= siteConfig.shop.freeShippingMin
      ? "כולל משלוח חינם"
      : `הוסיפו ₪${(siteConfig.shop.freeShippingMin - total).toLocaleString()} למשלוח חינם`;

  return (
    <div className="grid lg:grid-cols-[1.5fr_1fr] gap-10">
      <div className="space-y-5">
        <div className="border border-brand-border rounded-md overflow-hidden">
          <FreeShippingProgress />
        </div>
      <ul className="space-y-6">
        {items.map((item) => (
          <li key={item.key} className="flex gap-5 pb-6 border-b border-brand-border">
            <Link
              href={`/product/${item.slug}`}
              className="relative w-28 h-32 flex-shrink-0 overflow-hidden bg-brand-bg-soft"
            >
              <Image src={item.image} alt={item.name} fill sizes="112px" className="object-cover" />
            </Link>
            <div className="flex-1">
              <Link
                href={`/product/${item.slug}`}
                className="text-[1.05rem] font-medium text-brand-primary hover:text-brand-accent transition-colors no-underline"
              >
                {item.name}
              </Link>
              {item.size && (
                <div className="text-[0.82rem] text-brand-text-soft mt-1">
                  מידה: {item.size}
                </div>
              )}
              <div className="flex items-center gap-4 mt-3">
                <div className="inline-flex items-center border border-brand-border bg-white">
                  <button
                    onClick={() => changeQty(item.key, -1)}
                    className="w-9 h-9 hover:bg-brand-bg-soft flex items-center justify-center"
                    aria-label="הפחת"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-sm min-w-[36px] text-center">{item.qty}</span>
                  <button
                    onClick={() => changeQty(item.key, 1)}
                    className="w-9 h-9 hover:bg-brand-bg-soft flex items-center justify-center"
                    aria-label="הוסף"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  onClick={() => remove(item.key)}
                  className="inline-flex items-center gap-1.5 text-sm text-brand-text-soft hover:text-destructive transition-colors"
                  aria-label="הסר"
                >
                  <Trash2 className="w-4 h-4" />
                  הסר
                </button>
              </div>
            </div>
            <div className="text-left font-display text-xl text-brand-primary">
              {formatPrice(item.price * item.qty)}
            </div>
          </li>
        ))}
      </ul>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start bg-brand-surface p-7 border border-brand-border">
        <h2 className="font-body text-lg font-medium mb-5 text-brand-primary">סיכום הזמנה</h2>
        <div className="space-y-3 pb-5 border-b border-brand-border text-[0.92rem]">
          <div className="flex justify-between">
            <span className="text-brand-text-soft">סכום ביניים</span>
            <span>{formatPrice(total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-text-soft">משלוח</span>
            <span className="text-brand-accent">{shippingNote}</span>
          </div>
        </div>
        <div className="flex justify-between items-baseline pt-5 mb-6">
          <span className="text-[0.95rem] font-medium">סה"כ</span>
          <span className="font-display text-2xl text-brand-primary">{formatPrice(total)}</span>
        </div>
        <Link
          href="/checkout"
          className="block w-full bg-brand-primary text-white text-[0.78rem] tracking-[0.2em] uppercase font-medium text-center py-4 hover:bg-brand-primary-soft transition-colors no-underline"
        >
          למעבר לתשלום
        </Link>
        <Link
          href="/"
          className="block text-center text-[0.82rem] tracking-[0.12em] text-brand-text-soft hover:text-brand-accent py-3 mt-1 no-underline"
        >
          המשך לקנייה
        </Link>
        <p className="text-[0.78rem] text-brand-text-soft text-center mt-4 leading-relaxed">
          תשלום מאובטח · {siteConfig.shop.maxInstallments} תשלומים ללא ריבית · {siteConfig.shop.warranty}
        </p>
      </aside>
    </div>
  );
}
