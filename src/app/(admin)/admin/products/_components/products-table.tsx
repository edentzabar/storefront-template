"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useTransition } from "react";
import { Pencil, Trash2, Eye, EyeOff, Star } from "lucide-react";
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
import {
  deleteProduct,
  toggleProductActive,
  toggleProductFeatured,
} from "@/lib/admin/products-actions";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

type ProductRow = Prisma.ProductGetPayload<{ include: { category: true } }>;

export function ProductsTable({ products }: { products: ProductRow[] }) {
  const [pending, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<ProductRow | null>(null);

  function confirmDelete() {
    if (!toDelete) return;
    startTransition(async () => {
      const result = await deleteProduct(toDelete.id);
      if (result?.ok) toast.success(`${toDelete.name} נמחק`);
      else toast.error(result?.error ?? "שגיאה במחיקה");
      setToDelete(null);
    });
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16 bg-card border border-border rounded-lg text-muted-foreground">
        אין עדיין מוצרים.{" "}
        <Link
          href="/admin/products/new"
          className="text-brand-accent hover:underline"
        >
          צרו את הראשון
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
              <th className="px-4 py-3 text-right font-medium w-16">תמונה</th>
              <th className="px-4 py-3 text-right font-medium">שם</th>
              <th className="px-4 py-3 text-right font-medium hidden md:table-cell">קטגוריה</th>
              <th className="px-4 py-3 text-right font-medium">מחיר</th>
              <th className="px-4 py-3 text-right font-medium hidden sm:table-cell">מלאי</th>
              <th className="px-4 py-3 text-right font-medium hidden lg:table-cell">SKU</th>
              <th className="px-4 py-3 text-right font-medium">סטטוס</th>
              <th className="px-4 py-3 text-left font-medium w-24">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 align-middle">
                  <div className="relative size-12 overflow-hidden rounded-md bg-muted">
                    {p.image && (
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 align-middle">
                  <Link
                    href={`/admin/products/${p.id}/edit`}
                    className="font-medium text-sm text-foreground hover:text-brand-accent transition-colors no-underline"
                  >
                    {p.name}
                  </Link>
                  {p.meta && (
                    <div className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[280px]">
                      {p.meta}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 align-middle hidden md:table-cell text-sm text-muted-foreground">
                  {p.category.name}
                </td>
                <td className="px-4 py-3 align-middle">
                  <div className="text-base font-semibold tabular-nums">
                    {formatPrice(p.price)}
                  </div>
                  {p.originalPrice && (
                    <div className="text-[11px] text-muted-foreground line-through tabular-nums">
                      {formatPrice(p.originalPrice)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 align-middle hidden sm:table-cell">
                  <span
                    className={cn(
                      "text-sm tabular-nums",
                      p.stock === 0
                        ? "text-destructive font-medium"
                        : p.stock < 5
                          ? "text-amber-600 dark:text-amber-400 font-medium"
                          : "text-foreground",
                    )}
                  >
                    {p.stock}
                  </span>
                </td>
                <td className="px-4 py-3 align-middle hidden lg:table-cell text-[11px] text-muted-foreground font-mono">
                  {p.sku}
                </td>
                <td className="px-4 py-3 align-middle">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        startTransition(() => toggleProductActive(p.id, !p.isActive))
                      }
                      disabled={pending}
                      title={p.isActive ? "פעיל — לחץ להסתרה" : "מוסתר — לחץ להפעלה"}
                      className={cn(
                        "inline-flex items-center justify-center size-7 rounded-md transition-colors",
                        p.isActive
                          ? "text-brand-accent hover:bg-muted"
                          : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {p.isActive ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                    </button>
                    <button
                      onClick={() =>
                        startTransition(() =>
                          toggleProductFeatured(p.id, !p.isFeatured),
                        )
                      }
                      disabled={pending}
                      title={p.isFeatured ? "מוצג בדף הבית" : "לא בדף הבית"}
                      className={cn(
                        "inline-flex items-center justify-center size-7 rounded-md transition-colors",
                        p.isFeatured
                          ? "text-brand-accent hover:bg-muted"
                          : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      <Star
                        className={cn("size-4", p.isFeatured && "fill-current")}
                      />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 align-middle">
                  <div className="flex items-center gap-1 justify-end">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="inline-flex items-center justify-center size-8 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="ערוך"
                    >
                      <Pencil className="size-4" />
                    </Link>
                    <button
                      onClick={() => setToDelete(p)}
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
            <AlertDialogTitle>מחיקת מוצר</AlertDialogTitle>
            <AlertDialogDescription>
              למחוק את &quot;{toDelete?.name}&quot;? פעולה זו לא ניתנת לביטול.
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
