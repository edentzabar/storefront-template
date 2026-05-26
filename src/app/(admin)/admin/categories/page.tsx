import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "../_components/admin-page-header";
import { CategoriesTable } from "./_components/categories-table";

export const metadata: Metadata = {
  title: "ניהול קטגוריות",
  robots: { index: false, follow: false },
};

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="p-8">
      <AdminPageHeader
        title="קטגוריות"
        subtitle={`${categories.length} קטגוריות במסד`}
        action={{ label: "+ קטגוריה חדשה", href: "/admin/categories/new" }}
      />
      <CategoriesTable categories={categories} />
    </div>
  );
}
