import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "../../../_components/admin-page-header";
import { ProductForm } from "../../_components/product-form";
import { updateProduct } from "@/lib/admin/products-actions";

export const metadata: Metadata = {
  title: "עריכת מוצר",
  robots: { index: false, follow: false },
};

type Params = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Params) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { category: true },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  if (!product) notFound();

  const boundAction = updateProduct.bind(null, product.id);

  return (
    <div className="p-8">
      <AdminPageHeader
        title={`עריכת: ${product.name}`}
        subtitle={`SKU: ${product.sku}`}
      />
      <ProductForm
        categories={categories}
        product={product}
        action={boundAction}
        submitLabel="שמור שינויים"
      />
    </div>
  );
}
