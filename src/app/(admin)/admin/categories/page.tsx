import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "../_components/admin-page-header";
import { CategoriesTable, type CategoryRowWithAggregate } from "./_components/categories-table";

export const metadata: Metadata = {
  title: "ניהול קטגוריות",
  robots: { index: false, follow: false },
};

export default async function AdminCategoriesPage() {
  const all = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: "asc" },
  });

  // For each parent, the displayed product count should INCLUDE products
  // sitting in its subcategories — that's the user's mental model
  // ("how many products live under this section?"). Leaves + childless
  // categories keep their direct count.
  const childrenSumByParent = new Map<string, number>();
  for (const c of all) {
    if (c.parentId) {
      childrenSumByParent.set(
        c.parentId,
        (childrenSumByParent.get(c.parentId) ?? 0) + c._count.products,
      );
    }
  }

  const withAggregates: CategoryRowWithAggregate[] = all.map((c) => {
    const childrenSum = childrenSumByParent.get(c.id) ?? 0;
    return {
      ...c,
      // total = direct products on this category + products in all its subs
      aggregateProductCount: c._count.products + childrenSum,
      // explicit field — used by the table to show e.g. "3 (2 בתתים)"
      // when there's both direct + subcategory products
      childrenProductCount: childrenSum,
    };
  });

  // Re-order so each top-level is immediately followed by its children
  const tops = withAggregates.filter((c) => c.parentId === null);
  const sorted = tops.flatMap((parent) => [
    parent,
    ...withAggregates.filter((c) => c.parentId === parent.id),
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
