import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "../_components/admin-page-header";
import { ProductsTable } from "./_components/products-table";

export const metadata: Metadata = {
  title: "ניהול מוצרים",
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8">
      <AdminPageHeader
        title="מוצרים"
        subtitle={`${products.length} מוצרים במסד`}
        action={{ label: "+ מוצר חדש", href: "/admin/products/new" }}
      />
      <ProductsTable products={products} />
    </div>
  );
}
