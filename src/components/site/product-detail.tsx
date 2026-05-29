"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShieldCheck, Truck, CreditCard, RotateCcw } from "lucide-react";
import type { Product, Category } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { siteConfig } from "@/lib/site-config";
import { AddToCartButton } from "./add-to-cart-button";
import { RestockForm } from "./restock-form";
import { WishlistButton } from "./wishlist-button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type Props = { product: Product; category: Category };

export function ProductDetail({ product, category }: Props) {
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [mainImage, setMainImage] = useState(product.image);

  const onSale = product.originalPrice != null;
  const discount = onSale
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;
  const requiresSize =
    product.sizes !== undefined && product.sizes.length > 0;

  return (
    <main className="py-8 px-6 lg:px-10">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16">
        {/* Gallery */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="relative aspect-[4/5] overflow-hidden bg-brand-bg-soft mb-3">
            <Image
              src={mainImage}
              alt={product.name}
              fill
              priority
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-cover"
            />
            <WishlistButton
              productId={product.id}
              className="w-11 h-11 [&_svg]:w-5 [&_svg]:h-5"
            />
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((img) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => setMainImage(img)}
                  className={`relative aspect-square overflow-hidden border transition-colors ${
                    mainImage === img ? "border-brand-accent" : "border-brand-border"
                  }`}
                >
                  <Image src={img} alt={product.name} fill sizes="120px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {/* Category eyebrow */}
          <div className="mb-3">
            <Link
              href={`/category/${category.slug}`}
              className="text-[0.72rem] tracking-[0.3em] uppercase text-brand-accent hover:underline no-underline"
            >
              {category.name}
            </Link>
          </div>

          {/* Title + meta */}
          <h1 className="font-body text-[clamp(1.6rem,3.2vw,2.4rem)] font-normal leading-tight text-brand-primary mb-1.5">
            {product.name}
          </h1>
          {product.meta && (
            <div className="text-[0.92rem] text-brand-text-soft tracking-wide mb-6">
              {product.meta}
            </div>
          )}

          {/* Price block — distinct row with bottom divider */}
          <div className="flex items-baseline flex-wrap gap-x-3 gap-y-2 pb-6 mb-6 border-b border-brand-border/70">
            {onSale ? (
              <>
                <span className="font-display text-3xl font-medium text-brand-primary tabular-nums">
                  {formatPrice(product.price)}
                </span>
                <span className="text-base text-brand-text-soft line-through tabular-nums">
                  {formatPrice(product.originalPrice!)}
                </span>
                <span className="text-[0.72rem] font-body font-semibold tracking-[0.15em] bg-brand-accent text-white px-2.5 py-1 rounded-sm">
                  חיסכון {discount}%
                </span>
              </>
            ) : (
              <span className="font-display text-3xl font-medium text-brand-primary tabular-nums">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-[0.98rem] leading-loose text-brand-text mb-7 font-light">
            {product.description}
          </p>

          {/* Size selector */}
          {requiresSize && (
            <div className="mb-7">
              <div className="flex justify-between items-baseline mb-3">
                <span className="text-[0.82rem] tracking-[0.1em] uppercase text-brand-text-soft">
                  בחירת מידה
                </span>
                <Link
                  href="/size-guide"
                  className="text-[0.78rem] text-brand-accent hover:underline"
                >
                  מדריך מידות
                </Link>
              </div>
              <div className="flex flex-wrap gap-2" role="radiogroup">
                {product.sizes!.map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={size === s}
                    onClick={() => setSize(s)}
                    className={`min-w-[64px] px-4 py-3 text-sm border transition-colors ${
                      size === s
                        ? "bg-brand-primary text-white border-brand-primary"
                        : "bg-white border-brand-border hover:border-brand-text"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity — own row, refined */}
          <div className="flex items-center gap-5 mb-4">
            <span className="text-[0.82rem] tracking-[0.1em] uppercase text-brand-text-soft">
              כמות
            </span>
            <div className="inline-flex items-center border border-brand-border bg-white">
              <button
                type="button"
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="size-11 inline-flex items-center justify-center hover:bg-brand-bg-soft text-brand-text transition-colors"
                aria-label="הפחת"
              >
                <Minus className="size-3.5" strokeWidth={2} />
              </button>
              <input
                type="number"
                value={qty}
                onChange={(e) =>
                  setQty(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))
                }
                min={1}
                max={99}
                aria-label="כמות"
                className="w-12 h-11 text-center border-x border-brand-border bg-transparent text-sm tabular-nums focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => setQty(Math.min(99, qty + 1))}
                className="size-11 inline-flex items-center justify-center hover:bg-brand-bg-soft text-brand-text transition-colors"
                aria-label="הוסף"
              >
                <Plus className="size-3.5" strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Big primary CTA — full width.
              When out of stock, swap the button for a restock waitlist
              form so the visitor can leave their email + get notified. */}
          {product.stock > 0 ? (
            <AddToCartButton
              product={product}
              size={size}
              qty={qty}
              openCart
              requireSize={requiresSize}
              className="w-full py-5 text-[0.85rem] tracking-[0.25em] mb-8"
              label="הוספה לעגלה"
            />
          ) : (
            <div className="mb-8">
              <RestockForm productId={product.id} />
            </div>
          )}

          {/* Trust bullets — pills layout, easier to scan */}
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 mb-8 text-[0.85rem] text-brand-text font-light">
            <li className="flex items-center gap-2">
              <Truck className="size-4 text-brand-accent shrink-0" strokeWidth={1.75} />
              משלוח חינם מעל ₪{siteConfig.shop.freeShippingMin}
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-brand-accent shrink-0" strokeWidth={1.75} />
              {siteConfig.shop.warranty}
            </li>
            <li className="flex items-center gap-2">
              <CreditCard className="size-4 text-brand-accent shrink-0" strokeWidth={1.75} />
              עד {siteConfig.shop.maxInstallments} תשלומים ללא ריבית
            </li>
            <li className="flex items-center gap-2">
              <RotateCcw className="size-4 text-brand-accent shrink-0" strokeWidth={1.75} />
              {siteConfig.shop.returnDays} ימי החזרה
            </li>
          </ul>

          {/* Additional info — single combined section. Specs + care if present.
              In the template MVP we keep it minimal; each client site can split
              this into multiple sections later as needed. */}
          {((product.specs && Object.keys(product.specs).length > 0) ||
            product.careInstructions) && (
            <Accordion multiple defaultValue={["info"]} className="w-full">
              <AccordionItem value="info">
                <AccordionTrigger className="text-[0.95rem] font-medium">
                  מידע נוסף
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-5 text-[0.92rem] leading-loose text-brand-text">
                    {product.specs && Object.keys(product.specs).length > 0 && (
                      <dl className="grid grid-cols-[max-content_1fr] gap-x-8 gap-y-2.5">
                        {Object.entries(product.specs).map(([k, v]) => (
                          <div key={k} className="contents">
                            <dt className="text-brand-text-soft">{k}</dt>
                            <dd className="text-brand-primary font-medium">{v}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    {product.careInstructions && (
                      <div className="border-t border-brand-border/60 pt-4">
                        <div className="text-[0.78rem] tracking-[0.15em] uppercase text-brand-text-soft mb-2">
                          טיפול ושמירה
                        </div>
                        {product.careInstructions}
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      </div>
    </main>
  );
}
