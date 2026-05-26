import type { Metadata } from "next";
import { getAllProducts, getAllCategories } from "@/lib/queries";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { SearchView } from "./search-view";

export const metadata: Metadata = {
  title: "חיפוש",
  description: "חפשו במגוון המוצרים שלנו.",
};

export default async function SearchPage() {
  const [products, categories] = await Promise.all([
    getAllProducts(),
    getAllCategories(),
  ]);
  return (
    <>
      <Breadcrumbs items={[{ label: "בית", href: "/" }, { label: "חיפוש" }]} />
      <main className="py-12 px-6 lg:px-10">
        <div className="max-w-[1100px] mx-auto">
          <h1 className="font-body text-3xl font-light text-brand-primary mb-8 text-center">
            חיפוש
          </h1>
          <SearchView products={products} categories={categories} />
        </div>
      </main>
    </>
  );
}
