"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Prisma } from "@prisma/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { deleteCategory } from "@/lib/admin/categories-actions";
import { cn } from "@/lib/utils";

type CategoryRow = Prisma.CategoryGetPayload<{
  include: { _count: { select: { products: true } } };
}>;

export function CategoriesTable({ categories }: { categories: CategoryRow[] }) {
  const [pending, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<CategoryRow | null>(null);

  function confirmDelete() {
    if (!toDelete) return;
    startTransition(async () => {
      const result = await deleteCategory(toDelete.id);
      if (result?.ok) toast.success(`${toDelete.name} נמחקה`);
      else toast.error(result?.error ?? "שגיאה במחיקה");
      setToDelete(null);
    });
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-16 bg-card border border-border rounded-lg text-muted-foreground">
        אין עדיין קטגוריות.{" "}
        <Link
          href="/admin/categories/new"
          className="text-brand-accent hover:underline"
        >
          צרו את הראשונה
        </Link>
        .
      </div>
    );
  }

  return (
    <>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-right font-medium">תמונה</th>
              <th className="px-4 py-3 text-right font-medium">שם</th>
              <th className="px-4 py-3 text-right font-medium hidden md:table-cell">Slug</th>
              <th className="px-4 py-3 text-right font-medium hidden sm:table-cell">מוצרים</th>
              <th className="px-4 py-3 text-right font-medium hidden lg:table-cell">סדר</th>
              <th className="px-4 py-3 text-right font-medium">סטטוס</th>
              <th className="px-4 py-3 text-left font-medium w-24">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.map((c) => (
              <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 align-middle">
                  <div className="relative size-12 overflow-hidden rounded-md bg-muted">
                    {c.image && (
                      <Image
                        src={c.image}
                        alt={c.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 align-middle">
                  <div
                    className={cn(
                      "flex items-center gap-2",
                      // visually indent subcategories so the hierarchy is obvious
                      c.parentId && "ps-6",
                    )}
                  >
                    {c.parentId && (
                      <span className="text-muted-foreground text-xs select-none">↳</span>
                    )}
                    <div>
                      <Link
                        href={`/admin/categories/${c.id}/edit`}
                        className="font-medium text-foreground hover:text-brand-accent transition-colors no-underline"
                      >
                        {c.name}
                      </Link>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {c.nameEn}
                        {c.parentId && (
                          <span className="ms-2 inline-block bg-muted px-1.5 py-0.5 rounded text-[10px]">
                            תת-קטגוריה
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 align-middle hidden md:table-cell text-[11px] text-muted-foreground font-mono">
                  /{c.slug}
                </td>
                <td className="px-4 py-3 align-middle hidden sm:table-cell text-sm tabular-nums">
                  {c._count.products}
                </td>
                <td className="px-4 py-3 align-middle hidden lg:table-cell text-sm text-muted-foreground tabular-nums">
                  {c.sortOrder}
                </td>
                <td className="px-4 py-3 align-middle">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] px-2 py-0.5 font-medium border-0",
                      c.isActive
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {c.isActive ? "פעיל" : "מוסתר"}
                  </Badge>
                </td>
                <td className="px-4 py-3 align-middle">
                  <div className="flex items-center gap-1 justify-end">
                    <Link
                      href={`/admin/categories/${c.id}/edit`}
                      className="inline-flex items-center justify-center size-8 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="ערוך"
                    >
                      <Pencil className="size-4" />
                    </Link>
                    <button
                      onClick={() => setToDelete(c)}
                      disabled={pending}
                      className="inline-flex items-center justify-center size-8 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
                      title="מחק"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת קטגוריה</AlertDialogTitle>
            <AlertDialogDescription>
              למחוק את &quot;{toDelete?.name}&quot;? פעולה זו לא ניתנת לביטול.
              {toDelete && toDelete._count.products > 0 && (
                <span className="block mt-2 text-destructive">
                  ⚠ יש {toDelete._count.products} מוצרים בקטגוריה. צריך להעבירם או למחוק אותם קודם.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {pending ? "מוחק…" : "מחק"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
