"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, useMemo } from "react";
import { toast } from "sonner";
import { OrderStatus } from "@prisma/client";
import { format, formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { ArrowLeft, MoreHorizontal, Trash2, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_LABELS } from "@/lib/admin/order-helpers";
import {
  bulkUpdateOrderStatus,
  bulkDeleteOrders,
} from "@/lib/admin/orders-actions";
import { cn } from "@/lib/utils";

type Order = {
  id: string;
  status: OrderStatus;
  customerFullName: string;
  customerEmail: string;
  total: number;
  itemsCount: number;
  createdAt: Date;
};

const STATUSES: OrderStatus[] = ["new", "processing", "shipped", "delivered", "cancelled"];

const STATUS_TONE: Record<OrderStatus, string> = {
  new: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
};

export function OrdersTable({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const allChecked = orders.length > 0 && selected.size === orders.length;
  const someChecked = selected.size > 0 && selected.size < orders.length;

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === orders.length ? new Set() : new Set(orders.map((o) => o.id)),
    );
  }

  function handleBulkStatus(status: OrderStatus) {
    startTransition(async () => {
      const ids = Array.from(selected);
      const result = await bulkUpdateOrderStatus(ids, status);
      if (result.ok) {
        toast.success(`עודכנו ${result.count} הזמנות ל"${STATUS_LABELS[status]}"`);
        setSelected(new Set());
      } else toast.error(result.error ?? "שגיאה בעדכון");
    });
  }

  function handleBulkDelete() {
    startTransition(async () => {
      const ids = Array.from(selected);
      const result = await bulkDeleteOrders(ids);
      if (result.ok) {
        toast.success(`נמחקו ${result.count} הזמנות`);
        setSelected(new Set());
      } else toast.error(result.error ?? "שגיאה במחיקה");
      setConfirmDelete(false);
    });
  }

  function handleExportCsv() {
    const rows = orders.filter((o) => selected.has(o.id));
    const header = ["id", "status", "customer", "email", "total", "items", "created_at"];
    const csv = [
      header.join(","),
      ...rows.map((r) =>
        [
          r.id,
          r.status,
          `"${r.customerFullName.replace(/"/g, '""')}"`,
          r.customerEmail,
          r.total,
          r.itemsCount,
          r.createdAt.toISOString(),
        ].join(","),
      ),
    ].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`יוצאו ${rows.length} הזמנות`);
  }

  const selectedTotal = useMemo(
    () => orders.filter((o) => selected.has(o.id)).reduce((s, o) => s + o.total, 0),
    [selected, orders],
  );

  return (
    <>
      {/* Bulk action bar — floats on top of table when items selected */}
      {selected.size > 0 && (
        <div className="sticky top-16 z-20 mb-3 bg-foreground text-background rounded-lg px-4 py-2.5 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelected(new Set())}
              className="size-6 grid place-items-center rounded hover:bg-background/10"
              aria-label="נקה בחירה"
            >
              <X className="size-4" />
            </button>
            <div className="text-sm">
              <span className="font-medium tabular-nums">{selected.size}</span> נבחרו · סה&quot;כ{" "}
              <span className="tabular-nums">₪{selectedTotal.toLocaleString("he-IL")}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select onValueChange={(v) => handleBulkStatus(v as OrderStatus)} disabled={pending}>
              <SelectTrigger className="h-8 bg-background text-foreground border-0 w-auto min-w-[140px]">
                <SelectValue placeholder="שנה סטטוס" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportCsv}
              className="h-8 bg-background text-foreground hover:bg-background/90"
            >
              ייצוא CSV
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => setConfirmDelete(true)}
              disabled={pending}
              className="size-8"
              aria-label="מחק נבחרים"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-lg text-muted-foreground">
          אין הזמנות התואמות לסינון.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="w-10 px-4 py-3 text-right">
                  <Checkbox
                    checked={allChecked}
                    indeterminate={someChecked}
                    onCheckedChange={() => toggleAll()}
                    aria-label="בחר הכל"
                  />
                </th>
                <th className="px-4 py-3 text-right font-medium">לקוח</th>
                <th className="px-4 py-3 text-right font-medium hidden md:table-cell">תאריך</th>
                <th className="px-4 py-3 text-right font-medium hidden sm:table-cell">פריטים</th>
                <th className="px-4 py-3 text-right font-medium">סטטוס</th>
                <th className="px-4 py-3 text-left font-medium">סכום</th>
                <th className="w-10 px-2 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((o) => {
                const isSel = selected.has(o.id);
                return (
                  <tr
                    key={o.id}
                    className={cn(
                      "group transition-colors",
                      isSel ? "bg-brand-bg-soft/60 dark:bg-muted/40" : "hover:bg-muted/30",
                    )}
                  >
                    <td className="px-4 py-3 align-middle">
                      <Checkbox
                        checked={isSel}
                        onCheckedChange={() => toggleOne(o.id)}
                        aria-label={`בחר הזמנה ${String(o.id)}`}
                      />
                    </td>
                    <td
                      className="px-4 py-3 align-middle cursor-pointer"
                      onClick={() => router.push(`/admin/orders/${o.id}`)}
                    >
                      <div className="font-medium text-sm">{o.customerFullName}</div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                        {o.customerEmail}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle hidden md:table-cell text-sm text-muted-foreground">
                      <div>{format(o.createdAt, "d MMM yyyy", { locale: he })}</div>
                      <div className="text-[11px]">
                        {formatDistanceToNow(o.createdAt, { addSuffix: true, locale: he })}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle hidden sm:table-cell text-sm text-muted-foreground">
                      {o.itemsCount}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px] px-2 py-0.5 font-medium border-0",
                          STATUS_TONE[o.status],
                        )}
                      >
                        {STATUS_LABELS[o.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 align-middle text-left">
                      <span className="text-base font-semibold tabular-nums">
                        ₪{o.total.toLocaleString("he-IL")}
                      </span>
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="פעולות"
                            />
                          }
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>שנה סטטוס</DropdownMenuLabel>
                          {STATUSES.map((s) => (
                            <DropdownMenuItem
                              key={s}
                              disabled={s === o.status}
                              onClick={() =>
                                startTransition(async () => {
                                  const r = await bulkUpdateOrderStatus([o.id], s);
                                  if (r.ok) toast.success(`עודכן ל-${STATUS_LABELS[s]}`);
                                  else toast.error(r.error ?? "שגיאה");
                                })
                              }
                            >
                              {STATUS_LABELS[s]}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => router.push(`/admin/orders/${o.id}`)}
                          >
                            <ArrowLeft className="size-4" />
                            פתח פרטים
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>למחוק {selected.size} הזמנות?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק לצמיתות את ההזמנות הנבחרות. לא ניתן לבטל.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
