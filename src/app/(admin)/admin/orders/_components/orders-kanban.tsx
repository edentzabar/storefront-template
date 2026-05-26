"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { OrderStatus } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { MoreHorizontal, ArrowRightLeft } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { STATUS_LABELS } from "@/lib/admin/order-helpers";
import { bulkUpdateOrderStatus } from "@/lib/admin/orders-actions";
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

const COLUMNS: { status: OrderStatus; tone: string; bg: string }[] = [
  { status: "new", tone: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50/50 dark:bg-amber-950/20" },
  {
    status: "processing",
    tone: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50/50 dark:bg-blue-950/20",
  },
  {
    status: "shipped",
    tone: "text-indigo-700 dark:text-indigo-400",
    bg: "bg-indigo-50/50 dark:bg-indigo-950/20",
  },
  {
    status: "delivered",
    tone: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50/50 dark:bg-emerald-950/20",
  },
  {
    status: "cancelled",
    tone: "text-rose-700 dark:text-rose-400",
    bg: "bg-rose-50/50 dark:bg-rose-950/20",
  },
];

export function OrdersKanban({ orders }: { orders: Order[] }) {
  const [pending, startTransition] = useTransition();

  function move(id: string, to: OrderStatus) {
    startTransition(async () => {
      const r = await bulkUpdateOrderStatus([id], to);
      if (r.ok) toast.success(`הועבר ל"${STATUS_LABELS[to]}"`);
      else toast.error(r.error ?? "שגיאה");
    });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3" dir="rtl">
      {COLUMNS.map((col) => {
        const items = orders.filter((o) => o.status === col.status);
        const total = items.reduce((s, o) => s + o.total, 0);
        return (
          <div
            key={col.status}
            className={cn(
              "rounded-lg border border-border flex flex-col min-h-[400px] max-h-[calc(100vh-280px)]",
              col.bg,
            )}
          >
            <div className="px-3 py-2.5 border-b border-border/60 shrink-0">
              <div className="flex items-center justify-between">
                <div className={cn("text-xs font-semibold", col.tone)}>
                  {STATUS_LABELS[col.status]}
                </div>
                <div className="text-[11px] text-muted-foreground tabular-nums">
                  {items.length}
                </div>
              </div>
              {items.length > 0 && (
                <div className="text-[10px] text-muted-foreground tabular-nums mt-0.5">
                  ₪{total.toLocaleString("he-IL")}
                </div>
              )}
            </div>
            <div className="p-2 flex-1 overflow-y-auto space-y-2">
              {items.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-8">
                  אין הזמנות
                </div>
              ) : (
                items.map((o) => (
                  <div
                    key={o.id}
                    className="bg-card border border-border rounded-md p-3 hover:shadow-sm transition-shadow group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-medium text-sm leading-tight no-underline text-foreground flex-1 min-w-0"
                      >
                        {o.customerFullName}
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              disabled={pending}
                              className="-mr-1 -mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="העבר"
                            />
                          }
                        >
                          <MoreHorizontal className="size-3.5" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel className="text-[10px]">
                            <ArrowRightLeft className="size-3 inline-block ml-1" />
                            העבר לסטטוס
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {COLUMNS.filter((c) => c.status !== col.status).map((c) => (
                            <DropdownMenuItem
                              key={c.status}
                              onClick={() => move(o.id, c.status)}
                            >
                              {STATUS_LABELS[c.status]}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {o.customerEmail}
                    </div>
                    <div className="flex items-end justify-between mt-2">
                      <div className="text-[10px] text-muted-foreground">
                        {o.itemsCount} פריטים ·{" "}
                        {formatDistanceToNow(o.createdAt, { addSuffix: true, locale: he })}
                      </div>
                      <div className="text-sm font-semibold tabular-nums">
                        ₪{o.total.toLocaleString("he-IL")}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
