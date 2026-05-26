import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { CheckoutFlow } from "./checkout-flow";

export const metadata: Metadata = {
  title: "תשלום",
  description: "השלמת ההזמנה.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "בית", href: "/" }, { label: "סל הקניות", href: "/cart" }, { label: "תשלום" }]} />
      <main className="py-10 px-6 lg:px-10">
        <div className="max-w-[1100px] mx-auto">
          <h1 className="font-body text-3xl font-light text-brand-primary mb-10 text-center">
            תשלום
          </h1>
          <CheckoutFlow />
        </div>
      </main>
    </>
  );
}
