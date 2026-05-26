import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ImportWizard } from "./_components/import-wizard";

export const metadata: Metadata = {
  title: "ייבוא מוצרים",
  robots: { index: false, follow: false },
};

export default async function ImportPage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="p-4 md:p-8 max-w-[1100px]">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground">
          ייבוא מוצרים
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          העלאת מוצרים בכמות מקובץ ייצוא של Shopify או WooCommerce
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
          חובה ליצור לפחות קטגוריה אחת לפני ייבוא מוצרים.{" "}
          <a href="/admin/categories/new" className="text-brand-accent hover:underline">
            צור קטגוריה
          </a>
        </div>
      ) : (
        <ImportWizard categories={categories} />
      )}
    </div>
  );
}
