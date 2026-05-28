import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "../../_components/admin-page-header";
import { CategoryForm } from "../_components/category-form";
import { createCategory } from "@/lib/admin/categories-actions";

export const metadata: Metadata = {
  title: "קטגוריה חדשה",
  robots: { index: false, follow: false },
};

export default async function NewCategoryPage() {
  // Only top-level categories can be parents — we cap hierarchy at 2 levels.
  const parents = await prisma.category.findMany({
    where: { parentId: null },
    select: { id: true, name: true },
    orderBy: { sortOrder: "asc" },
  });
  return (
    <div className="p-8">
      <AdminPageHeader title="קטגוריה חדשה" />
      <CategoryForm parents={parents} action={createCategory} submitLabel="צור קטגוריה" />
    </div>
  );
}
