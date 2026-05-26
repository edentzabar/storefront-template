import type { Metadata } from "next";
import { getSaleProducts } from "@/lib/queries";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { CategoryGrid } from "../category/[slug]/category-grid";

export const metadata: Metadata = {
  title: "מבצעים",
  description: "מוצרים במחירי מבצע.",
};

export default async function SalePage() {
  const saleProducts = await getSaleProducts();
  return (
    <>
      <Breadcrumbs items={[{ label: "בית", href: "/" }, { label: "מבצעים" }]} />
      <header className="py-16 px-6 lg:px-10 bg-brand-bg text-center border-b border-brand-border">
        <div className="text-[0.78rem] tracking-[0.4em] uppercase text-brand-accent mb-3">Sale</div>
        <h1 className="font-body text-[clamp(2rem,4vw,3rem)] font-light text-brand-primary tracking-wide">
          מבצעים
        </h1>
      </header>
      <main className="py-12 lg:py-16 px-6 lg:px-10">
        <div className="max-w-[1400px] mx-auto">
          <CategoryGrid products={saleProducts} />
        </div>
      </main>
    </>
  );
}
