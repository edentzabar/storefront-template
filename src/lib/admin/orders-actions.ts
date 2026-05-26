"use server";

import { after } from "next/server";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/session";
import { sendEmail } from "@/lib/email/client";
import { orderStatusEmail } from "@/lib/email/templates";

function invalidateOrderCaches() {
  updateTag("orders");
}

/**
 * Fire-and-forget — sends an order status email to the customer if the new
 * status meaningfully changed. Only triggers for shipped/delivered/cancelled
 * — "new" and "processing" are internal and the customer already got
 * the order confirmation, so we don't spam them.
 */
function notifyStatusChange(orderId: string, newStatus: OrderStatus) {
  if (newStatus !== "shipped" && newStatus !== "delivered" && newStatus !== "cancelled") {
    return;
  }
  after(async () => {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      if (!order) return;
      const tpl = orderStatusEmail(order);
      await sendEmail({
        to: order.customerEmail,
        subject: tpl.subject,
        html: tpl.html,
      });
    } catch (err) {
      console.error("[notifyStatusChange] email failed:", err);
    }
  });
}

const statusSchema = z.enum(OrderStatus);

async function assertAdmin() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
}

export async function updateOrderStatus(orderId: string, status: string) {
  await assertAdmin();
  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return { ok: false, error: "סטטוס לא חוקי" };
  await prisma.order.update({
    where: { id: orderId },
    data: { status: parsed.data },
  });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  invalidateOrderCaches();
  notifyStatusChange(orderId, parsed.data);
  return { ok: true };
}

// ---------- tracking + internal notes ----------

const trackingSchema = z.string().max(120).nullable();
const internalNotesSchema = z.string().max(4000).nullable();

export async function updateOrderTracking(orderId: string, tracking: string | null) {
  await assertAdmin();
  const parsed = trackingSchema.safeParse(tracking?.trim() || null);
  if (!parsed.success) return { ok: false, error: "מספר מעקב לא חוקי" };
  await prisma.order.update({
    where: { id: orderId },
    data: { trackingNumber: parsed.data },
  });
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function updateOrderInternalNotes(orderId: string, notes: string | null) {
  await assertAdmin();
  const parsed = internalNotesSchema.safeParse(notes?.trim() || null);
  if (!parsed.success) return { ok: false, error: "הערות ארוכות מדי" };
  await prisma.order.update({
    where: { id: orderId },
    data: { internalNotes: parsed.data },
  });
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function deleteOrder(orderId: string) {
  await assertAdmin();
  try {
    await prisma.order.delete({ where: { id: orderId } });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "שגיאה במחיקה" };
  }
  revalidatePath("/admin/orders");
  invalidateOrderCaches();
  return { ok: true };
}

// ---------- bulk actions ----------

export async function bulkUpdateOrderStatus(orderIds: string[], status: string) {
  await assertAdmin();
  const idsParse = z.array(z.string().min(1)).min(1).safeParse(orderIds);
  const statusParse = statusSchema.safeParse(status);
  if (!idsParse.success || !statusParse.success) {
    return { ok: false, error: "קלט לא חוקי" };
  }
  const result = await prisma.order.updateMany({
    where: { id: { in: idsParse.data } },
    data: { status: statusParse.data },
  });
  revalidatePath("/admin/orders");
  invalidateOrderCaches();
  for (const id of idsParse.data) {
    notifyStatusChange(id, statusParse.data);
  }
  return { ok: true, count: result.count };
}

export async function bulkDeleteOrders(orderIds: string[]) {
  await assertAdmin();
  const parsed = z.array(z.string().min(1)).min(1).safeParse(orderIds);
  if (!parsed.success) return { ok: false, error: "קלט לא חוקי" };
  const result = await prisma.order.deleteMany({
    where: { id: { in: parsed.data } },
  });
  revalidatePath("/admin/orders");
  invalidateOrderCaches();
  return { ok: true, count: result.count };
}
