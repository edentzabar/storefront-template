import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  subDays,
  differenceInCalendarDays,
  startOfDay,
  startOfMonth,
  endOfDay,
  format,
  eachDayOfInterval,
} from "date-fns";

// 30-second cache for layout-level queries.
const LAYOUT_REVALIDATE = 30;

// ---------- date range helpers ----------

export type DateRange = { from: Date; to: Date };

/** Create a range covering the last `days` days, inclusive of today. */
export function rangeFromWindow(days: number): DateRange {
  const now = new Date();
  return { from: startOfDay(subDays(now, days - 1)), to: endOfDay(now) };
}

/** Parse from/to ISO date strings (yyyy-MM-dd). Returns null if invalid. */
export function rangeFromIso(fromIso?: string, toIso?: string): DateRange | null {
  if (!fromIso || !toIso) return null;
  const from = new Date(fromIso);
  const to = new Date(toIso);
  if (isNaN(from.getTime()) || isNaN(to.getTime())) return null;
  if (from > to) return null;
  return { from: startOfDay(from), to: endOfDay(to) };
}

/** Return the previous (same-length) range immediately preceding `range`. */
function previousRange(range: DateRange): DateRange {
  const days = differenceInCalendarDays(range.to, range.from) + 1;
  const previousTo = startOfDay(range.from);
  const previousFrom = subDays(previousTo, days);
  return { from: previousFrom, to: previousTo };
}

// ---------- dashboard KPIs ----------

export type KpiBundle = {
  revenue: { current: number; previous: number; delta: number };
  orders: { current: number; previous: number; delta: number };
  customers: { current: number; previous: number; delta: number };
  aov: { current: number; previous: number; delta: number };
  pendingOrders: number;
  lowStockCount: number;
};

export async function getKpis(range: DateRange): Promise<KpiBundle> {
  const prev = previousRange(range);

  const [
    currentOrders,
    previousOrders,
    currentCustomers,
    previousCustomers,
    pendingOrders,
    lowStockCount,
  ] = await Promise.all([
    prisma.order.findMany({
      where: {
        createdAt: { gte: range.from, lte: range.to },
        status: { not: "cancelled" },
      },
      select: { total: true },
    }),
    prisma.order.findMany({
      where: {
        createdAt: { gte: prev.from, lt: prev.to },
        status: { not: "cancelled" },
      },
      select: { total: true },
    }),
    prisma.user.count({
      where: { createdAt: { gte: range.from, lte: range.to }, role: "customer" },
    }),
    prisma.user.count({
      where: { createdAt: { gte: prev.from, lt: prev.to }, role: "customer" },
    }),
    prisma.order.count({ where: { status: { in: ["new", "processing"] } } }),
    prisma.product.count({ where: { isActive: true, stock: { lte: 5 } } }),
  ]);

  const currentRevenue = currentOrders.reduce((s, o) => s + o.total, 0);
  const previousRevenue = previousOrders.reduce((s, o) => s + o.total, 0);
  const currentAov = currentOrders.length ? currentRevenue / currentOrders.length : 0;
  const previousAov = previousOrders.length ? previousRevenue / previousOrders.length : 0;

  const pct = (cur: number, prev: number) =>
    prev === 0 ? (cur > 0 ? 100 : 0) : ((cur - prev) / prev) * 100;

  return {
    revenue: {
      current: currentRevenue,
      previous: previousRevenue,
      delta: pct(currentRevenue, previousRevenue),
    },
    orders: {
      current: currentOrders.length,
      previous: previousOrders.length,
      delta: pct(currentOrders.length, previousOrders.length),
    },
    customers: {
      current: currentCustomers,
      previous: previousCustomers,
      delta: pct(currentCustomers, previousCustomers),
    },
    aov: {
      current: currentAov,
      previous: previousAov,
      delta: pct(currentAov, previousAov),
    },
    pendingOrders,
    lowStockCount,
  };
}

// ---------- revenue timeseries ----------

export type DailyPoint = { date: string; label: string; revenue: number; orders: number };

export async function getRevenueTimeseries(range: DateRange): Promise<DailyPoint[]> {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: range.from, lte: range.to },
      status: { not: "cancelled" },
    },
    select: { createdAt: true, total: true },
  });

  const days = eachDayOfInterval({ start: range.from, end: range.to });
  const buckets = new Map<string, { revenue: number; orders: number }>();
  for (const d of days) {
    buckets.set(format(d, "yyyy-MM-dd"), { revenue: 0, orders: 0 });
  }
  for (const o of orders) {
    const key = format(startOfDay(o.createdAt), "yyyy-MM-dd");
    const b = buckets.get(key);
    if (b) {
      b.revenue += o.total;
      b.orders += 1;
    }
  }

  return Array.from(buckets.entries()).map(([date, v]) => ({
    date,
    label: format(new Date(date), "d MMM"),
    revenue: v.revenue,
    orders: v.orders,
  }));
}

// ---------- top products ----------

export type TopProduct = {
  id: string;
  name: string;
  image: string;
  unitsSold: number;
  revenue: number;
};

export async function getTopProducts(limit = 5, range?: DateRange): Promise<TopProduct[]> {
  const r = range ?? rangeFromWindow(30);
  const items = await prisma.orderItem.findMany({
    where: {
      order: {
        createdAt: { gte: r.from, lte: r.to },
        status: { not: "cancelled" },
      },
    },
    include: { product: { select: { id: true, name: true, image: true } } },
  });

  const map = new Map<string, TopProduct>();
  for (const it of items) {
    const id = it.product.id;
    if (!map.has(id)) {
      map.set(id, {
        id,
        name: it.product.name,
        image: it.product.image,
        unitsSold: 0,
        revenue: 0,
      });
    }
    const t = map.get(id)!;
    t.unitsSold += it.qty;
    t.revenue += it.price * it.qty;
  }

  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

// ---------- recent orders ----------

export async function getRecentOrders(limit = 8) {
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      status: true,
      customerFullName: true,
      customerEmail: true,
      total: true,
      createdAt: true,
      _count: { select: { items: true } },
    },
  });
}

// ---------- low stock ----------

export async function getLowStockProducts(threshold = 5, limit = 10) {
  return prisma.product.findMany({
    where: { isActive: true, stock: { lte: threshold } },
    orderBy: { stock: "asc" },
    take: limit,
    select: { id: true, slug: true, name: true, sku: true, stock: true, image: true, price: true },
  });
}

// ---------- cached versions for layout (30s TTL) ----------

export const getPendingOrdersCount = unstable_cache(
  async () => prisma.order.count({ where: { status: { in: ["new", "processing"] } } }),
  ["admin-pending-orders-count"],
  { revalidate: LAYOUT_REVALIDATE, tags: ["orders"] },
);

export const getLayoutRecentOrders = unstable_cache(
  async (limit: number) =>
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        status: true,
        customerFullName: true,
        customerEmail: true,
        total: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    }),
  ["admin-layout-recent-orders"],
  { revalidate: LAYOUT_REVALIDATE, tags: ["orders"] },
);

export const getLayoutLowStock = unstable_cache(
  async (threshold: number, limit: number) =>
    prisma.product.findMany({
      where: { isActive: true, stock: { lte: threshold } },
      orderBy: { stock: "asc" },
      take: limit,
      select: { id: true, slug: true, name: true, sku: true, stock: true },
    }),
  ["admin-layout-low-stock"],
  { revalidate: LAYOUT_REVALIDATE, tags: ["products"] },
);

// ---------- customer stats ----------

export type CustomerStats = {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  firstOrderAt: Date | null;
  lastOrderAt: Date | null;
};

export async function getCustomerStats(userId: string): Promise<CustomerStats> {
  const orders = await prisma.order.findMany({
    where: { userId, status: { not: "cancelled" } },
    select: { total: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((s, o) => s + o.total, 0);
  return {
    totalOrders,
    totalSpent,
    averageOrderValue: totalOrders ? totalSpent / totalOrders : 0,
    firstOrderAt: orders[0]?.createdAt ?? null,
    lastOrderAt: orders[orders.length - 1]?.createdAt ?? null,
  };
}

// ---------- top customers ----------

export type TopCustomer = {
  id: string | null;
  name: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
};

export async function getTopCustomers(
  range: DateRange,
  limit = 10,
): Promise<TopCustomer[]> {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: range.from, lte: range.to },
      status: { not: "cancelled" },
    },
    select: {
      total: true,
      customerEmail: true,
      customerFullName: true,
      userId: true,
    },
  });

  const map = new Map<string, TopCustomer>();
  for (const o of orders) {
    const key = o.customerEmail.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.totalOrders += 1;
      existing.totalSpent += o.total;
    } else {
      map.set(key, {
        id: o.userId,
        name: o.customerFullName,
        email: o.customerEmail,
        totalOrders: 1,
        totalSpent: o.total,
      });
    }
  }
  return Array.from(map.values())
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, limit);
}

// ---------- sales by category ----------

export type CategorySales = {
  id: string;
  name: string;
  unitsSold: number;
  revenue: number;
};

export async function getSalesByCategory(range: DateRange): Promise<CategorySales[]> {
  const items = await prisma.orderItem.findMany({
    where: {
      order: {
        createdAt: { gte: range.from, lte: range.to },
        status: { not: "cancelled" },
      },
    },
    include: {
      product: {
        select: {
          categoryId: true,
          category: { select: { id: true, name: true } },
        },
      },
    },
  });
  const map = new Map<string, CategorySales>();
  for (const it of items) {
    const cat = it.product.category;
    if (!cat) continue;
    const existing = map.get(cat.id);
    if (existing) {
      existing.unitsSold += it.qty;
      existing.revenue += it.price * it.qty;
    } else {
      map.set(cat.id, {
        id: cat.id,
        name: cat.name,
        unitsSold: it.qty,
        revenue: it.price * it.qty,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
}

// ---------- monthly customer growth ----------

export type MonthPoint = { month: string; label: string; count: number };

export async function getCustomerGrowth(months = 6): Promise<MonthPoint[]> {
  const start = startOfMonth(subDays(new Date(), 30 * (months - 1)));
  const users = await prisma.user.findMany({
    where: { createdAt: { gte: start }, role: "customer" },
    select: { createdAt: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < months; i++) {
    const d = startOfMonth(subDays(new Date(), 30 * (months - 1 - i)));
    buckets.set(format(d, "yyyy-MM"), 0);
  }
  for (const u of users) {
    const key = format(startOfMonth(u.createdAt), "yyyy-MM");
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return Array.from(buckets.entries()).map(([month, count]) => ({
    month,
    label: format(new Date(`${month}-01`), "MMM"),
    count,
  }));
}
