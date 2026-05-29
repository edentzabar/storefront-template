import type { Metadata } from "next";
import { AdminPageHeader } from "../../_components/admin-page-header";
import { CategoryForm } from "../_components/category-form";
import { createCategory } from "@/lib/admin/categories-actions";

export const metadata: Metadata = {
  title: "קטגוריה חדשה",
  robots: { index: false, follow: false },
};

export default function NewCategoryPage() {
  // New categories are always created as top-level — subcategories live
  // inside their parent's form. The form here exposes the inline
  // "תתי-קטגוריות" editor for adding them up front if desired.
  return (
    <div className="p-8">
      <AdminPageHeader title="קטגוריה חדשה" />
      <CategoryForm action={createCategory} submitLabel="צור קטגוריה" />
    </div>
  );
}
