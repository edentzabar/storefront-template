import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import {
  ShoppingCart,
  UserPlus,
  CheckCircle2,
  Truck,
  Package,
  XCircle,
} from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import { STATUS_LABELS } from "@/lib/admin/order-helpers";

type Order = {
  id: string;
  total: number;
  status: OrderStatus;
  createdAt: Date;
  itemsCount: number;
};

type TimelineEvent =
  | { type: "registered"; date: Date }
  | { type: "order"; date: Date; order: Order };

const ORDER_ICON: Record<OrderStatus, typeof ShoppingCart> = {
  new: ShoppingCart,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle2,
  cancelled: XCircle,
};

const ORDER_TONE: Record<OrderStatus, string> = {
  new: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  shipped: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400",
  delivered:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400",
};

export function CustomerTimeline({
  createdAt,
  orders,
}: {
  createdAt: Date;
  orders: Order[];
}) {
  const events: TimelineEvent[] = [
    { type: "registered" as const, date: createdAt },
    ...orders.map((o) => ({ type: "order" as const, date: o.createdAt, order: o })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <ol className="relative space-y-4 before:absolute before:right-[19px] before:top-2 before:bottom-2 before:w-px before:bg-border">
      {events.map((e, i) => {
        if (e.type === "registered") {
          return (
            <li key={`r-${i}`} className="flex gap-4 items-start relative z-10">
              <div className="size-10 rounded-full bg-brand-bg-soft dark:bg-muted border-2 border-background grid place-items-center shrink-0">
                <UserPlus className="size-4 text-brand-accent" />
              </div>
              <div className="flex-1 pt-2">
                <div className="text-sm">
                  <span className="font-medium">נרשם/ה כלקוח/ה</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {format(e.date, "d MMMM yyyy, HH:mm", { locale: he })} ·{" "}
                  {formatDistanceToNow(e.date, { addSuffix: true, locale: he })}
                </div>
              </div>
            </li>
          );
        }
        const o = e.order;
        const Icon = ORDER_ICON[o.status];
        return (
          <li key={o.id} className="flex gap-4 items-start relative z-10">
            <div
              className={`size-10 rounded-full border-2 border-background grid place-items-center shrink-0 ${ORDER_TONE[o.status]}`}
            >
              <Icon className="size-4" />
            </div>
            <div className="flex-1 pt-1">
              <div className="flex items-center justify-between gap-3">
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="text-sm font-medium no-underline text-foreground hover:text-brand-accent transition-colors"
                >
                  הזמנה ·{" "}
                  <span className="text-muted-foreground font-normal">
                    {STATUS_LABELS[o.status]}
                  </span>
                </Link>
                <span className="text-base font-semibold tabular-nums">
                  ₪{o.total.toLocaleString("he-IL")}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {o.itemsCount} פריטים ·{" "}
                {format(e.date, "d MMM yyyy, HH:mm", { locale: he })} ·{" "}
                {formatDistanceToNow(e.date, { addSuffix: true, locale: he })}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
