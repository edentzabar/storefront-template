import type { Metadata } from "next";
import Link from "next/link";
import { differenceInCalendarDays, format } from "date-fns";
import { he } from "date-fns/locale";
import { DollarSign, ShoppingBag, TrendingUp, Users } from "lucide-react";
import {
  getKpis,
  getRevenueTimeseries,
  getTopProducts,
  getTopCustomers,
  getSalesByCategory,
  rangeFromIso,
  rangeFromWindow,
} from "@/lib/admin-queries";
import { KpiCard } from "@/components/admin/dashboard/kpi-card";
import { RevenueChart } from "@/components/admin/dashboard/revenue-chart";
import { TopProducts } from "@/components/admin/dashboard/top-products";
import { DashboardRange } from "../_components/dashboard-range";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const metadata: Metadata = {
  title: "דוחות מכירות",
  robots: { index: false, follow: false },
};

const ALLOWED_WINDOWS = [7, 30, 90];

function fmtIls(value: number) {
  return `₪${Math.round(value).toLocaleString("he-IL")}`;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const custom = rangeFromIso(params.from, params.to);
  const windowDays = ALLOWED_WINDOWS.includes(Number(params.window))
    ? Number(params.window)
    : custom
      ? null
      : 30;
  const range = custom ?? rangeFromWindow(windowDays!);
  const totalDays = differenceInCalendarDays(range.to, range.from) + 1;

  const [kpis, timeseries, topProducts, topCustomers, salesByCategory] =
    await Promise.all([
      getKpis(range),
      getRevenueTimeseries(range),
      getTopProducts(10, range),
      getTopCustomers(range, 10),
      getSalesByCategory(range),
    ]);

  const totalCategoryRev = salesByCategory.reduce((s, c) => s + c.revenue, 0);

  return (
    <div className="p-4 md:p-8 max-w-[1600px]">
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground">
            דוחות מכירות
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {format(range.from, "d MMM yyyy", { locale: he })} —{" "}
            {format(range.to, "d MMM yyyy", { locale: he })} · {totalDays} ימים
          </p>
        </div>
        <DashboardRange
          activeWindow={windowDays}
          activeFrom={custom ? (params.from ?? null) : null}
          activeTo={custom ? (params.to ?? null) : null}
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="הכנסות"
          value={fmtIls(kpis.revenue.current)}
          delta={kpis.revenue.delta}
          icon={DollarSign}
        />
        <KpiCard
          label="הזמנות"
          value={kpis.orders.current.toLocaleString("he-IL")}
          delta={kpis.orders.delta}
          icon={ShoppingBag}
        />
        <KpiCard
          label="ערך הזמנה ממוצע"
          value={fmtIls(kpis.aov.current)}
          delta={kpis.aov.delta}
          icon={TrendingUp}
        />
        <KpiCard
          label="לקוחות חדשים"
          value={kpis.customers.current.toLocaleString("he-IL")}
          delta={kpis.customers.delta}
          icon={Users}
        />
      </div>

      {/* Revenue chart */}
      <div className="bg-card border border-border rounded-lg p-5 mb-6">
        <div className="flex items-end justify-between mb-2">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              מכירות יומיות
            </div>
            <div className="text-2xl mt-1 font-semibold tabular-nums tracking-tight">
              {fmtIls(kpis.revenue.current)}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">{totalDays} ימים</div>
        </div>
        <RevenueChart data={timeseries} />
      </div>

      {/* Two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <TopProducts products={topProducts} />

        {/* Top customers */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <div className="font-medium">לקוחות מובילים</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              מובילי הכנסות בתקופה
            </div>
          </div>
          {topCustomers.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              אין הזמנות בתקופה זו.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {topCustomers.map((c, i) => {
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
      </div>

      {/* Sales by category */}
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="mb-4">
          <div className="font-medium">מכירות לפי קטגוריה</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            פילוח ההכנסות
          </div>
        </div>
        {salesByCategory.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            אין מכירות בתקופה זו.
          </div>
        ) : (
          <div className="space-y-3">
            {salesByCategory.map((cat) => {
              const pct = totalCategoryRev ? (cat.revenue / totalCategoryRev) * 100 : 0;
              return (
                <div key={cat.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{cat.name}</span>
                    <span className="text-muted-foreground tabular-nums">
                      <span className="font-semibold text-foreground">
                        {fmtIls(cat.revenue)}
                      </span>{" "}
                      · {cat.unitsSold} יחידות · {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-gradient"
                      style={{ width: `${Math.max(2, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
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
  c: { name: string; email: string; totalOrders: number; totalSpent: number };
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
