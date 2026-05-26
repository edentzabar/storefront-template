import type { Metadata } from "next";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { OrdersToolbar } from "./_components/orders-toolbar";
import { OrdersTable } from "./_components/orders-table";
import { OrdersKanban } from "./_components/orders-kanban";

export const metadata: Metadata = {
  title: "ניהול הזמנות",
  robots: { index: false, follow: false },
};

const ALL_STATUSES: OrderStatus[] = [
  "new",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; view?: string }>;
}) {
  const params = await searchParams;
  const status = ALL_STATUSES.includes(params.status as OrderStatus)
    ? (params.status as OrderStatus)
    : undefined;
  const q = (params.q ?? "").trim();
  const view = params.view === "kanban" ? "kanban" : "list";

  // Fetch filtered orders + counts in parallel
  const [orders, allCounts] = await Promise.all([
    prisma.order.findMany({
      where: {
        status,
        ...(q && {
          OR: [
            { customerFullName: { contains: q, mode: "insensitive" } },
            { customerEmail: { contains: q, mode: "insensitive" } },
            { id: { contains: q, mode: "insensitive" } },
          ],
        }),
      },
      include: { _count: { select: { items: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
  ]);

  const counts = ALL_STATUSES.reduce(
    (acc, s) => {
      acc[s] = allCounts.find((c) => c.status === s)?._count.status ?? 0;
      return acc;
    },
    { all: 0 } as Record<OrderStatus | "all", number>,
  );
  counts.all = Object.values(counts).reduce((s, v) => s + v, 0) - counts.all; // sum excluding the "all" 0

  const tableData = orders.map((o) => ({
    id: o.id,
    status: o.status,
    customerFullName: o.customerFullName,
    customerEmail: o.customerEmail,
    total: o.total,
    itemsCount: o._count.items,
    createdAt: o.createdAt,
  }));

  return (
    <div className="p-4 md:p-8 max-w-[1600px]">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground">הזמנות</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {counts.all.toLocaleString("he-IL")} הזמנות בסך הכל
        </p>
      </div>

      <div className="mb-4">
        <OrdersToolbar counts={counts} />
      </div>

      {view === "kanban" ? (
        <OrdersKanban orders={tableData} />
      ) : (
        <OrdersTable orders={tableData} />
      )}
    </div>
  );
}
