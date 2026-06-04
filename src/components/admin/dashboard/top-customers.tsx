import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Customer = {
  id: string | null;
  name: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
};

function fmtIls(value: number) {
  return `₪${Math.round(value).toLocaleString("he-IL")}`;
}

/**
 * Top customers panel — was the unique analytical bit on the now-removed
 * /admin/reports page. Folded into the dashboard so the merchant still
 * sees who their best buyers are without a separate nav item.
 */
export function TopCustomersList({ customers }: { customers: Customer[] }) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <div className="font-medium">לקוחות מובילים</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          מובילי הכנסות בתקופה
        </div>
      </div>
      {customers.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          אין הזמנות בתקופה זו.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {customers.map((c, i) => {
            const initials = c.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();
            return (
              <li key={c.email}>
                {c.id ? (
                  <Link
                    href={`/admin/customers/${c.id}`}
                    className="block no-underline text-foreground"
                  >
                    <CustomerRow rank={i + 1} initials={initials} c={c} />
                  </Link>
                ) : (
                  <CustomerRow rank={i + 1} initials={initials} c={c} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function CustomerRow({
  rank,
  initials,
  c,
}: {
  rank: number;
  initials: string;
  c: Customer;
}) {
  return (
    <div className="px-5 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
      <div className="text-[11px] tabular-nums text-muted-foreground w-4 text-center shrink-0">
        #{rank}
      </div>
      <Avatar className="size-8">
        <AvatarFallback className="bg-brand-bg-soft dark:bg-muted text-foreground text-[10px] font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="font-medium text-sm truncate">{c.name}</div>
        <div className="text-[11px] text-muted-foreground truncate">
          {c.email} · {c.totalOrders} הזמנות
        </div>
      </div>
      <div className="text-sm font-semibold tabular-nums shrink-0">
        {fmtIls(c.totalSpent)}
      </div>
    </div>
  );
}
