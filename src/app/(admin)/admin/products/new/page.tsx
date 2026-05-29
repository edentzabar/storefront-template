import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "../../_components/admin-page-header";
import { ProductForm, type CategoryTreeForPicker } from "../_components/product-form";
import { createProduct } from "@/lib/admin/products-actions";

export const metadata: Metadata = {
  title: "מוצר חדש",
  robots: { index: false, follow: false },
};

/** Shape the flat categories list into a 2-level tree for the picker. */
async function loadCategoryTree(): Promise<CategoryTreeForPicker> {
  const all = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, parentId: true },
  });
  return all
    .filter((c) => c.parentId === null)
    .map((parent) => ({
      id: parent.id,
      name: parent.name,
      children: all
        .filter((c) => c.parentId === parent.id)
        .map((c) => ({ id: c.id, name: c.name })),
    }));
}

export default async function NewProductPage() {
  const categories = await loadCategoryTree();

  return (
    <div className="p-8">
      <AdminPageHeader title="מוצר חדש" subtitle="הוספת מוצר לקולקציה" />
      <ProductForm categories={categories} action={createProduct} submitLabel="צור מוצר" />
    </div>
  );
}
