import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "../../../_components/admin-page-header";
import { CategoryForm } from "../../_components/category-form";
import { updateCategory } from "@/lib/admin/categories-actions";

export const metadata: Metadata = {
  title: "עריכת קטגוריה",
  robots: { index: false, follow: false },
};

type Params = { params: Promise<{ id: string }> };

export default async function EditCategoryPage({ params }: Params) {
  const { id } = await params;
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) notFound();

  // Available parents = top-level categories except this one (no self-ref).
  // If this category has its own children, it can't become a subcategory
  // (would create a 3-level tree, which we don't support). In that case
  // we hand an empty parents list so the form's toggle is moot.
  const hasChildren = (await prisma.category.count({ where: { parentId: id } })) > 0;
  const parents = hasChildren
    ? []
    : await prisma.category.findMany({
        where: { parentId: null, id: { not: id } },
        select: { id: true, name: true },
        orderBy: { sortOrder: "asc" },
      });

  const boundAction = updateCategory.bind(null, category.id);

  return (
    <div className="p-8">
      <AdminPageHeader title={`עריכת: ${category.name}`} />
      <CategoryForm
        category={category}
        parents={parents}
        action={boundAction}
        submitLabel="שמור שינויים"
      />
    </div>
  );
}
