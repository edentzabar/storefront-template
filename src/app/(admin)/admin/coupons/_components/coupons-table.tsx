"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { Coupon } from "@prisma/client";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Pencil, Trash2, Copy, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import { deleteCoupon, toggleCouponActive } from "@/lib/admin/coupons-actions";
import { cn } from "@/lib/utils";

export function CouponsTable({ coupons }: { coupons: Coupon[] }) {
  const [pending, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<Coupon | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function handleToggle(c: Coupon) {
    startTransition(async () => {
      const r = await toggleCouponActive(c.id, !c.isActive);
      if (r.ok) toast.success(c.isActive ? "הקופון הושבת" : "הקופון הופעל");
    });
  }

  function handleDelete() {
    if (!toDelete) return;
    startTransition(async () => {
      const r = await deleteCoupon(toDelete.id);
      if (r.ok) toast.success(`${toDelete.code} נמחק`);
      else toast.error(r.error ?? "שגיאה");
      setToDelete(null);
    });
  }

  function copyCode(code: string, id: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success("הקוד הועתק");
    setTimeout(() => setCopiedId(null), 1500);
  }

  if (coupons.length === 0) {
    return (
      <div className="text-center py-16 bg-card border border-border rounded-lg text-muted-foreground">
        אין עדיין קופונים.{" "}
        <Link href="/admin/coupons/new" className="text-brand-accent hover:underline">
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
              <th className="px-4 py-3 text-right font-medium">קוד</th>
              <th className="px-4 py-3 text-right font-medium">הנחה</th>
              <th className="px-4 py-3 text-right font-medium hidden md:table-cell">מינימום</th>
              <th className="px-4 py-3 text-right font-medium hidden sm:table-cell">שימושים</th>
              <th className="px-4 py-3 text-right font-medium hidden lg:table-cell">תוקף</th>
              <th className="px-4 py-3 text-right font-medium">פעיל</th>
              <th className="px-4 py-3 text-left font-medium w-24">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {coupons.map((c) => {
              const exhausted = c.maxUses ? c.uses >= c.maxUses : false;
              const expired = c.expiresAt ? c.expiresAt < new Date() : false;
              const usagePct = c.maxUses ? Math.min(100, (c.uses / c.maxUses) * 100) : 0;
              return (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyCode(c.code, c.id)}
                        className="inline-flex items-center gap-1.5 font-mono text-sm font-medium hover:text-brand-accent transition-colors"
                        title="העתק"
                      >
                        {c.code}
                        {copiedId === c.id ? (
                          <Check className="size-3 text-emerald-600" />
                        ) : (
                          <Copy className="size-3 opacity-40 hover:opacity-100" />
                        )}
                      </button>
                    </div>
                    {c.description && (
                      <div className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[260px]">
                        {c.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <span className="text-sm font-semibold tabular-nums">
                      {c.type === "percent"
                        ? `${c.value}%`
                        : `₪${c.value.toLocaleString("he-IL")}`}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle hidden md:table-cell text-sm text-muted-foreground tabular-nums">
                    {c.minSubtotal > 0 ? `₪${c.minSubtotal.toLocaleString("he-IL")}` : "—"}
                  </td>
                  <td className="px-4 py-3 align-middle hidden sm:table-cell">
                    <div className="text-sm tabular-nums">
                      {c.uses}
                      {c.maxUses && (
                        <span className="text-muted-foreground"> / {c.maxUses}</span>
                      )}
                    </div>
                    {c.maxUses && (
                      <div className="mt-1 h-1 w-16 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-accent"
                          style={{ width: `${usagePct}%` }}
                        />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-middle hidden lg:table-cell text-sm text-muted-foreground">
                    {c.expiresAt
                      ? format(c.expiresAt, "d MMM yyyy", { locale: he })
                      : "ללא"}
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={c.isActive && !expired && !exhausted}
                        onCheckedChange={() => handleToggle(c)}
                        disabled={pending || expired || exhausted}
                      />
                      {(expired || exhausted) && (
                        <Badge variant="outline" className="text-[10px] bg-muted">
                          {expired ? "פג תוקף" : "נוצל"}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center gap-1 justify-end">
                      <Link
                        href={`/admin/coupons/${c.id}/edit`}
                        className="inline-flex items-center justify-center size-8 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="ערוך"
                      >
                        <Pencil className="size-4" />
                      </Link>
                      <button
                        onClick={() => setToDelete(c)}
                        disabled={pending}
                        className={cn(
                          "inline-flex items-center justify-center size-8 rounded-md hover:bg-destructive/10 text-destructive transition-colors",
                        )}
                        title="מחק"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת קופון</AlertDialogTitle>
            <AlertDialogDescription>
              למחוק את &quot;{toDelete?.code}&quot;? הקופון לא יוכל להיות מנוצל יותר.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
