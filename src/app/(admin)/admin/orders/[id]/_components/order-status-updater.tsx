"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { OrderStatus } from "@prisma/client";
import { STATUS_LABELS } from "@/lib/admin/order-helpers";
import { updateOrderStatus } from "@/lib/admin/orders-actions";

const STATUSES: OrderStatus[] = ["new", "processing", "shipped", "delivered", "cancelled"];

export function OrderStatusUpdater({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, status);
      if (result?.ok) toast.success("הסטטוס עודכן");
      else toast.error(result?.error ?? "שגיאה בעדכון");
    });
  }

  const changed = status !== currentStatus;

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-[0.78rem] tracking-[0.1em] uppercase text-brand-text-soft mb-1.5 block">
          עדכן סטטוס
        </span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus)}
          className="w-full px-4 py-2.5 border border-brand-border bg-white focus:outline-none focus:border-brand-primary text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </label>
      <button
        onClick={handleSave}
        disabled={!changed || pending}
        className="w-full px-4 py-2.5 bg-brand-primary text-white text-[0.78rem] tracking-[0.15em] uppercase font-medium hover:bg-brand-primary-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? "מעדכן…" : "שמור"}
      </button>
    </div>
  );
}
