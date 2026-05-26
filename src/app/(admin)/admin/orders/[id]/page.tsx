import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Printer } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  SHIPPING_LABELS,
  PAYMENT_LABELS,
} from "@/lib/admin/order-helpers";
import { AdminPageHeader } from "../../_components/admin-page-header";
import { OrderStatusUpdater } from "./_components/order-status-updater";
import {
  OrderTrackingEditor,
  OrderInternalNotesEditor,
} from "./_components/order-meta-editor";

export const metadata: Metadata = {
  title: "פרטי הזמנה",
  robots: { index: false, follow: false },
};

type Params = { params: Promise<{ id: string }> };

export default async function OrderDetailPage({ params }: Params) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { orderBy: { position: "asc" } } },
  });
  if (!order) notFound();

  return (
    <div className="p-8">
      <div className="mb-2 text-sm flex items-center justify-between gap-3">
        <Link href="/admin/orders" className="text-brand-text-soft hover:text-brand-accent inline-flex items-center gap-1">
          <ChevronRight className="w-3.5 h-3.5 rotate-180" />
          חזרה לרשימת הזמנות
        </Link>
        <Link
          href={`/admin/orders/${order.id}/print`}
          target="_blank"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors no-underline"
        >
          <Printer className="size-3.5" />
          תעודת משלוח
        </Link>
      </div>
      <AdminPageHeader
        title={`הזמנה #${order.id}`}
        subtitle={new Date(order.createdAt).toLocaleString("he-IL", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* items */}
        <div className="bg-white border border-brand-border p-6">
          <h2 className="font-body text-lg font-medium text-brand-primary mb-4 pb-3 border-b border-brand-border">
            פריטים
          </h2>
          <ul className="space-y-4">
            {order.items.map((item) => (
              <li key={item.id} className="flex gap-4 pb-4 border-b border-brand-border last:border-0">
                <div className="relative w-16 h-20 flex-shrink-0 overflow-hidden bg-brand-bg-soft">
                  {item.image && (
                    <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-brand-primary">{item.name}</div>
                  {item.size && (
                    <div className="text-xs text-brand-text-soft mt-1">מידה: {item.size}</div>
                  )}
                  <div className="text-sm text-brand-text-soft mt-1">
                    {formatPrice(item.price)} × {item.qty}
                  </div>
                </div>
                <div className="text-left text-base font-semibold tabular-nums">
                  {formatPrice(item.price * item.qty)}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-5 pt-5 border-t border-brand-border space-y-2 text-sm">
            <div className="flex justify-between text-brand-text-soft">
              <span>סכום ביניים</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-brand-text-soft">
              <span>משלוח</span>
              <span>{order.shippingCost === 0 ? "חינם" : formatPrice(order.shippingCost)}</span>
            </div>
            <div className="flex justify-between font-medium pt-2 mt-2 border-t border-brand-border text-base">
              <span>סה"כ</span>
              <span className="text-xl font-semibold tabular-nums">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* details + status */}
        <div className="space-y-6">
          <div className="bg-white border border-brand-border p-6">
            <h2 className="font-body text-lg font-medium text-brand-primary mb-4 pb-3 border-b border-brand-border">
              סטטוס
            </h2>
            <div className="mb-4">
              <span className={`inline-block text-xs px-2.5 py-1 ${STATUS_COLORS[order.status]}`}>
                {STATUS_LABELS[order.status]}
              </span>
            </div>
            <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
            <div className="mt-5 pt-5 border-t border-brand-border">
              <OrderTrackingEditor
                orderId={order.id}
                initialTracking={order.trackingNumber}
              />
            </div>
          </div>

          <div className="bg-white border border-brand-border p-6">
            <h2 className="font-body text-lg font-medium text-brand-primary mb-4 pb-3 border-b border-brand-border">
              הערות פנימיות
            </h2>
            <OrderInternalNotesEditor
              orderId={order.id}
              initialNotes={order.internalNotes}
            />
          </div>

          <div className="bg-white border border-brand-border p-6">
            <h2 className="font-body text-lg font-medium text-brand-primary mb-4 pb-3 border-b border-brand-border">
              לקוח
            </h2>
            <dl className="space-y-2.5 text-sm">
              <Row label="שם" value={order.customerFullName} />
              <Row label="אימייל" value={<a href={`mailto:${order.customerEmail}`} className="text-brand-accent hover:underline">{order.customerEmail}</a>} />
              <Row label="טלפון" value={<a href={`tel:${order.customerPhone}`} className="text-brand-accent hover:underline">{order.customerPhone}</a>} />
            </dl>
          </div>

          <div className="bg-white border border-brand-border p-6">
            <h2 className="font-body text-lg font-medium text-brand-primary mb-4 pb-3 border-b border-brand-border">
              משלוח
            </h2>
            <dl className="space-y-2.5 text-sm">
              <Row label="שיטה" value={SHIPPING_LABELS[order.shippingMethod]} />
              {order.shippingAddress && <Row label="כתובת" value={order.shippingAddress} />}
              {order.shippingCity && <Row label="עיר" value={order.shippingCity} />}
              {order.shippingZip && <Row label="מיקוד" value={order.shippingZip} />}
              {order.shippingNotes && <Row label="הערות" value={order.shippingNotes} />}
            </dl>
          </div>

          <div className="bg-white border border-brand-border p-6">
            <h2 className="font-body text-lg font-medium text-brand-primary mb-4 pb-3 border-b border-brand-border">
              תשלום
            </h2>
            <dl className="space-y-2.5 text-sm">
              <Row label="שיטה" value={PAYMENT_LABELS[order.paymentMethod]} />
              {order.paymentLast4 && <Row label="4 ספרות אחרונות" value={`•••• ${order.paymentLast4}`} />}
              {order.paymentReference && <Row label="אסמכתא" value={order.paymentReference} />}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-brand-text-soft">{label}</dt>
      <dd className="text-brand-primary text-left">{value}</dd>
    </div>
  );
}
