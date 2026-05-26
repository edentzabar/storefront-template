import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "../../_components/admin-page-header";
import { ProductForm } from "../_components/product-form";
import { createProduct } from "@/lib/admin/products-actions";

export const metadata: Metadata = {
  title: "מוצר חדש",
  robots: { index: false, follow: false },
};

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="p-8">
      <AdminPageHeader title="מוצר חדש" subtitle="הוספת מוצר לקולקציה" />
      <ProductForm categories={categories} action={createProduct} submitLabel="צור מוצר" />
    </div>
  );
}
