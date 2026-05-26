import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { getCurrentUser } from "@/lib/session";
import { AdminShell } from "@/components/admin/admin-shell";
import type { AdminNotification } from "@/components/admin/notifications-bell";
import {
  getPendingOrdersCount,
  getLayoutRecentOrders,
  getLayoutLowStock,
} from "@/lib/admin-queries";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) redirect("/account/login");
  if (user.role !== "admin") redirect("/");

  // Cached for 30s — avoids re-querying on every admin navigation.
  const [pendingOrders, recentOrders, lowStock] = await Promise.all([
    getPendingOrdersCount(),
    getLayoutRecentOrders(3),
    getLayoutLowStock(5, 5),
  ]);

  const notifications: AdminNotification[] = [];

  for (const o of recentOrders.filter(
    (r) => r.status === "new" || r.status === "processing",
  )) {
    notifications.push({
      id: `order-${o.id}`,
      type: "pending-order",
      title: `הזמנה חדשה — ${o.customerFullName}`,
      description: `${o._count.items} פריטים · ₪${o.total.toLocaleString("he-IL")}`,
      href: `/admin/orders/${o.id}`,
      time: formatDistanceToNow(o.createdAt, { addSuffix: true, locale: he }),
    });
  }

  for (const p of lowStock) {
    notifications.push({
      id: `stock-${p.id}`,
      type: "low-stock",
      title: `מלאי נמוך — ${p.name}`,
      description: `${p.stock} יחידות במלאי · ${p.sku}`,
      href: `/admin/products/${p.id}/edit`,
    });
  }

  return (
    <AdminShell
      userName={user.name}
      userEmail={user.email}
      pendingOrders={pendingOrders}
      notifications={notifications}
    >
      {children}
    </AdminShell>
  );
}
