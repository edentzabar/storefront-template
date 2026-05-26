import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@prisma/client";

const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "חדשה",
  processing: "בטיפול",
  shipped: "נשלחה",
  delivered: "נמסרה",
  cancelled: "בוטלה",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  new: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
};

type Order = {
  id: string;
  status: OrderStatus;
  customerFullName: string;
  customerEmail: string;
  total: number;
  createdAt: Date;
  _count: { items: number };
};

export function RecentOrders({ orders }: { orders: Order[] }) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <div className="font-medium">הזמנות אחרונות</div>
          <div className="text-xs text-muted-foreground mt-0.5">8 הזמנות אחרונות</div>
        </div>
        <Link
          href="/admin/orders"
          className="text-xs text-brand-accent hover:underline no-underline inline-flex items-center gap-1"
        >
          כל ההזמנות
          <ArrowLeft className="size-3" />
        </Link>
      </div>
      {orders.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          עוד אין הזמנות.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/admin/orders/${o.id}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors no-underline text-foreground"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{o.customerFullName}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {o._count.items} פריטים ·{" "}
                    {formatDistanceToNow(o.createdAt, { addSuffix: true, locale: he })}
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={cn("text-[10px] px-2 py-0.5 font-medium border-0", STATUS_COLORS[o.status])}
                >
                  {STATUS_LABELS[o.status]}
                </Badge>
                <div className="text-base font-semibold tabular-nums shrink-0">
                  ₪{o.total.toLocaleString("he-IL")}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export { STATUS_LABELS, STATUS_COLORS };
