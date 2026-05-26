import type { Metadata } from "next";
import { getAllProducts } from "@/lib/queries";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { WishlistView } from "./wishlist-view";

export const metadata: Metadata = {
  title: "מועדפים",
  description: "המוצרים שאהבת.",
  robots: { index: false, follow: true },
};

export default async function WishlistPage() {
  const allProducts = await getAllProducts();
  return (
    <>
      <Breadcrumbs items={[{ label: "בית", href: "/" }, { label: "מועדפים" }]} />
      <main className="py-12 px-6 lg:px-10">
        <div className="max-w-[1100px] mx-auto">
          <h1 className="font-body text-3xl font-light text-brand-primary mb-8 text-center">
            המועדפים שלי
          </h1>
          <WishlistView allProducts={allProducts} />
        </div>
      </main>
    </>
  );
}
