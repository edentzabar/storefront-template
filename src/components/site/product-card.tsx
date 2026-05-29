import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { WishlistButton } from "./wishlist-button";
import { AddToCartButton } from "./add-to-cart-button";

type Props = { product: Product };

export function ProductCard({ product }: Props) {
  const onSale = product.originalPrice != null;
  const outOfStock = product.stock <= 0;
  return (
    <div
      className="group block no-underline"
      itemScope
      itemType="https://schema.org/Product"
      data-product-id={product.id}
    >
      <Link href={`/product/${product.slug}`} className="block no-underline">
        <div className="relative aspect-[4/5] overflow-hidden bg-brand-bg-soft mb-3">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
            className={`object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
              outOfStock ? "opacity-75 grayscale-[35%]" : ""
            }`}
            itemProp="image"
          />

          {/* Top-right corner: ONE chip wins. Out-of-stock outranks
              the regular badge — you can't buy it anyway, so a
              "20% הנחה" next to "אזל המלאי" would be misleading.
              All chips share ONE uniform style — translucent
              brand-primary + backdrop-blur — so the cards look
              consistent regardless of badge type. (badgeType field
              still exists on the model for backwards compat, but
              the admin form no longer sets it.) */}
          {(outOfStock || product.badge) && (
            <span className="absolute top-3.5 right-3.5 inline-flex items-center px-2.5 py-1 text-[0.7rem] tracking-wider uppercase font-medium bg-brand-primary/85 text-white backdrop-blur-sm">
              {outOfStock ? "אזל המלאי" : product.badge}
            </span>
          )}

          <WishlistButton productId={product.id} />

          {/* Out-of-stock: nothing at the bottom — the top-right
              "אזל המלאי" badge already communicates it. Tapping the
              card itself leads to the detail page where the restock
              waitlist form lives. */}
          {!outOfStock && (
            <AddToCartButton
              product={product}
              variant="compact"
              label="הוספה לסל"
            />
          )}
        </div>

        <h3 className="text-[1.05rem] font-medium mb-1 text-brand-primary" itemProp="name">
          {product.name}
        </h3>
        <div className="text-[0.75rem] text-brand-text-soft mb-2 tracking-wider font-light">
          {product.meta}
        </div>
        <div
          className="flex items-center gap-2 text-[1rem] font-medium text-brand-primary"
          itemProp="offers"
          itemScope
          itemType="https://schema.org/Offer"
        >
          <meta itemProp="priceCurrency" content="ILS" />
          {onSale ? (
            <>
              <span className="text-brand-accent" itemProp="price" content={String(product.price)}>
                {formatPrice(product.price)}
              </span>
              <span className="text-[0.85rem] text-brand-text-soft line-through font-normal">
                {formatPrice(product.originalPrice!)}
              </span>
            </>
          ) : (
            <span itemProp="price" content={String(product.price)}>
              {formatPrice(product.price)}
            </span>
          )}
          <link itemProp="availability" href={`https://schema.org/${product.stock > 0 ? "InStock" : "OutOfStock"}`} />
        </div>
      </Link>
    </div>
  );
}
