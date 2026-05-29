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
  const [category, existingChildren] = await Promise.all([
    prisma.category.findUnique({ where: { id } }),
    prisma.category.findMany({
      where: { parentId: id },
      select: { id: true, name: true, nameEn: true, slug: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);
  if (!category) notFound();

  // Available parents = top-level categories except this one (no self-ref).
  // If this category has its own children, it can't become a subcategory
  // (would create a 3-level tree).
  const hasChildren = existingChildren.length > 0;
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
        existingChildren={existingChildren}
        action={boundAction}
        submitLabel="שמור שינויים"
      />
    </div>
  );
}
