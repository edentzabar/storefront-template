"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/lib/stores/cart-store";
import { formatPrice } from "@/lib/format";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export function CartDrawer() {
  const isOpen = useCart((s) => s.isOpen);
  const setOpen = useCart((s) => s.setOpen);
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.total());
  const remove = useCart((s) => s.remove);
  const changeQty = useCart((s) => s.changeQty);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="left" className="w-full sm:max-w-md flex flex-col p-0 gap-0">
        <SheetHeader className="px-6 py-5 border-b border-brand-border flex flex-row items-center justify-between space-y-0">
          <SheetTitle className="font-body text-lg font-medium">סל הקניות</SheetTitle>
          <SheetDescription className="sr-only">פריטים בעגלה</SheetDescription>
          <button onClick={() => setOpen(false)} aria-label="סגור" className="text-brand-text-soft hover:text-brand-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!mounted || items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="text-brand-text-soft mb-3">העגלה ריקה</div>
              {mounted && (
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="text-[0.82rem] tracking-[0.15em] uppercase text-brand-accent hover:underline"
                >
                  המשך לקנייה
                </Link>
              )}
            </div>
          ) : (
            <ul className="space-y-5">
              {items.map((item) => (
                <li key={item.key} className="flex gap-4 pb-5 border-b border-brand-border last:border-0">
                  <Link
                    href={`/product/${item.slug}`}
                    onClick={() => setOpen(false)}
                    className="relative w-20 h-24 flex-shrink-0 overflow-hidden bg-brand-bg-soft"
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${item.slug}`}
                      onClick={() => setOpen(false)}
                      className="text-[0.95rem] font-medium text-brand-primary hover:text-brand-accent transition-colors line-clamp-2 no-underline"
                    >
                      {item.name}
                    </Link>
                    {item.size && (
                      <div className="text-[0.75rem] text-brand-text-soft mt-0.5">
                        מידה: {item.size}
                      </div>
                    )}
                    <div className="text-[0.92rem] text-brand-primary mt-1">
                      {formatPrice(item.price)}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="inline-flex items-center border border-brand-border">
                        <button
                          onClick={() => changeQty(item.key, -1)}
                          className="w-7 h-7 hover:bg-brand-bg-soft flex items-center justify-center"
                          aria-label="הפחת"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-sm min-w-[28px] text-center">{item.qty}</span>
                        <button
                          onClick={() => changeQty(item.key, 1)}
                          className="w-7 h-7 hover:bg-brand-bg-soft flex items-center justify-center"
                          aria-label="הוסף"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => remove(item.key)}
                        className="text-brand-text-soft hover:text-destructive transition-colors p-1"
                        aria-label="הסר"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {mounted && items.length > 0 && (
          <div className="border-t border-brand-border px-6 py-5 space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-brand-text-soft">סה"כ:</span>
              <span className="text-xl font-display text-brand-primary">{formatPrice(total)}</span>
            </div>
            <Link
              href="/cart"
              onClick={() => setOpen(false)}
              className="block text-center text-[0.82rem] tracking-[0.12em] text-brand-text-soft hover:text-brand-accent py-1 no-underline"
            >
              לעמוד העגלה
            </Link>
            <Link
              href="/checkout"
              onClick={() => setOpen(false)}
              className="block w-full bg-brand-primary text-white text-[0.78rem] tracking-[0.2em] uppercase font-medium text-center py-4 hover:bg-brand-primary-soft transition-colors no-underline"
            >
              למעבר לתשלום
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
