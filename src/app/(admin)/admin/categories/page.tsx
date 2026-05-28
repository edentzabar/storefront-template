import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "../_components/admin-page-header";
import { CategoriesTable } from "./_components/categories-table";

export const metadata: Metadata = {
  title: "ניהול קטגוריות",
  robots: { index: false, follow: false },
};

export default async function AdminCategoriesPage() {
  const all = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: "asc" },
  });

  // Re-order so each top-level category is immediately followed by its
  // children — the table renders them as a visual tree.
  const tops = all.filter((c) => c.parentId === null);
  const sorted = tops.flatMap((parent) => [
    parent,
    ...all.filter((c) => c.parentId === parent.id),
  ]);

  return (
    <div className="p-8">
      <AdminPageHeader
        title="קטגוריות"
        subtitle={`${all.length} קטגוריות במסד`}
        action={{ label: "+ קטגוריה חדשה", href: "/admin/categories/new" }}
      />
      <CategoriesTable categories={sorted} />
    </div>
  );
}
