import { Suspense } from "react";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { CartView } from "./cart-view";
import { CartRecovery } from "@/components/site/cart-recovery";

export const metadata: Metadata = {
  title: "סל הקניות",
  description: "פריטים בעגלת הקניות שלך.",
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return (
    <>
      <Suspense fallback={null}>
        <CartRecovery />
      </Suspense>
      <Breadcrumbs items={[{ label: "בית", href: "/" }, { label: "סל הקניות" }]} />
      <main className="py-12 px-6 lg:px-10">
        <div className="max-w-[1100px] mx-auto">
          <h1 className="font-body text-3xl font-light text-brand-primary mb-10 text-center">
            סל הקניות
          </h1>
          <CartView />
        </div>
      </main>
    </>
  );
}
