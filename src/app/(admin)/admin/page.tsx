import type { Metadata } from "next";
import { differenceInCalendarDays } from "date-fns";
import {
  DollarSign,
  ShoppingBag,
  Users,
  TrendingUp,
} from "lucide-react";
import {
  getKpis,
  getRevenueTimeseries,
  getRecentOrders,
  getLowStockProducts,
  getTopProducts,
  rangeFromIso,
  rangeFromWindow,
} from "@/lib/admin-queries";
import { KpiCard } from "@/components/admin/dashboard/kpi-card";
import { RevenueChart, Sparkline } from "@/components/admin/dashboard/revenue-chart";
import { RecentOrders } from "@/components/admin/dashboard/recent-orders";
import { LowStockList } from "@/components/admin/dashboard/low-stock-list";
import { TopProducts } from "@/components/admin/dashboard/top-products";
import { DashboardRange } from "./_components/dashboard-range";

export const metadata: Metadata = {
  title: "דשבורד ניהול",
  robots: { index: false, follow: false },
};

const ALLOWED_WINDOWS = [7, 30, 90];

function fmtIls(value: number) {
  return `₪${Math.round(value).toLocaleString("he-IL")}`;
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ window?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;

  // Resolve the active range: custom from/to wins, else windowDays, else 30 days.
  const custom = rangeFromIso(params.from, params.to);
  const windowDays = ALLOWED_WINDOWS.includes(Number(params.window))
    ? Number(params.window)
    : custom
      ? null
      : 30;
  const range = custom ?? rangeFromWindow(windowDays!);
  const totalDays = differenceInCalendarDays(range.to, range.from) + 1;

  const [kpis, timeseries, recentOrders, lowStock, topProducts] = await Promise.all([
    getKpis(range),
    getRevenueTimeseries(range),
    getRecentOrders(8),
    getLowStockProducts(5, 6),
    getTopProducts(5, range),
  ]);

  const revenueSpark = timeseries.map((t) => t.revenue);
  const ordersSpark = timeseries.map((t) => t.orders);

  return (
    <div className="p-4 md:p-8 max-w-[1600px]">
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground">דשבורד</h1>
          <p className="text-sm text-muted-foreground mt-1">
            סקירת ביצועי החנות בזמן אמת
          </p>
        </div>
        <DashboardRange
          activeWindow={windowDays}
          activeFrom={custom ? params.from ?? null : null}
          activeTo={custom ? params.to ?? null : null}
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="הכנסות"
          value={fmtIls(kpis.revenue.current)}
          delta={kpis.revenue.delta}
          icon={DollarSign}
          sparkline={<Sparkline data={revenueSpark} />}
        />
        <KpiCard
          label="הזמנות"
          value={kpis.orders.current.toLocaleString("he-IL")}
          delta={kpis.orders.delta}
          icon={ShoppingBag}
          sparkline={<Sparkline data={ordersSpark} />}
        />
        <KpiCard
          label="לקוחות חדשים"
          value={kpis.customers.current.toLocaleString("he-IL")}
          delta={kpis.customers.delta}
          icon={Users}
        />
        <KpiCard
          label="ערך הזמנה ממוצע"
          value={fmtIls(kpis.aov.current)}
          delta={kpis.aov.delta}
          icon={TrendingUp}
        />
      </div>

      {/* Revenue chart */}
      <div className="bg-card border border-border rounded-lg p-5 mb-6">
        <div className="flex items-end justify-between mb-2">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">הכנסות</div>
            <div className="text-2xl mt-1 font-semibold tabular-nums tracking-tight">{fmtIls(kpis.revenue.current)}</div>
          </div>
          <div className="text-xs text-muted-foreground">{totalDays} ימים</div>
        </div>
        <RevenueChart data={timeseries} />
      </div>

      {/* Grid: orders / top products / low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <RecentOrders orders={recentOrders} />
        <TopProducts products={topProducts} />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <LowStockList products={lowStock} />
      </div>
    </div>
  );
}
