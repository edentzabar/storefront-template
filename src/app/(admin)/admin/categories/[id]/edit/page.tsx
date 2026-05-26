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

  const boundAction = updateCategory.bind(null, category.id);

  return (
    <div className="p-8">
      <AdminPageHeader title={`עריכת: ${category.name}`} />
      <CategoryForm category={category} action={boundAction} submitLabel="שמור שינויים" />
    </div>
  );
}
