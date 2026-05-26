import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { SHIPPING_LABELS, STATUS_LABELS } from "@/lib/admin/order-helpers";
import { siteConfig } from "@/lib/site-config";
import { PrintTrigger } from "./_print-trigger";
import "./print.css";

export const metadata: Metadata = {
  title: "תעודת משלוח",
  robots: { index: false, follow: false },
};

type Params = { params: Promise<{ id: string }> };

export default async function PackingSlipPage({ params }: Params) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { orderBy: { position: "asc" } } },
  });
  if (!order) notFound();

  const totalQty = order.items.reduce((s, i) => s + i.qty, 0);

  return (
    <>
      <PrintTrigger />
      <div className="packing-slip mx-auto bg-white text-zinc-900 max-w-[800px] p-10 print:p-8 print:max-w-none print:m-0">
        {/* Header */}
        <header className="flex items-start justify-between border-b-2 border-zinc-900 pb-6 mb-6">
          <div>
            <div className="font-display text-2xl font-medium tracking-[0.2em] text-zinc-900">
              {siteConfig.name}
            </div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 mt-0.5">
              {siteConfig.tagline}
            </div>
            <div className="text-xs text-zinc-500 mt-3 leading-relaxed">
              {siteConfig.contact.address}
              <br />
              {siteConfig.contact.phone} · {siteConfig.contact.email}
            </div>
          </div>
          <div className="text-left">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500">
              תעודת משלוח
            </div>
            <div className="text-xl font-mono font-semibold mt-1">#{order.id}</div>
            <div className="text-[11px] text-zinc-500 mt-1.5">
              {format(order.createdAt, "d בMMMM yyyy", { locale: he })}
            </div>
            <div className="text-[11px] mt-2 inline-block px-2 py-0.5 rounded border border-zinc-300">
              {STATUS_LABELS[order.status]}
            </div>
          </div>
        </header>

        {/* Customer + shipping */}
        <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
              נמען
            </div>
            <div className="font-medium">{order.customerFullName}</div>
            <div className="text-zinc-700">{order.customerPhone}</div>
            <div className="text-zinc-700">{order.customerEmail}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
              כתובת משלוח
            </div>
            <div className="font-medium">{SHIPPING_LABELS[order.shippingMethod]}</div>
            {order.shippingAddress && <div className="text-zinc-700">{order.shippingAddress}</div>}
            {(order.shippingCity || order.shippingZip) && (
              <div className="text-zinc-700">
                {order.shippingCity}
                {order.shippingZip && ` · ${order.shippingZip}`}
              </div>
            )}
            {order.shippingNotes && (
              <div className="text-zinc-700 mt-1 italic">{order.shippingNotes}</div>
            )}
          </div>
        </div>

        {/* Items */}
        <table className="w-full border-collapse mb-6">
          <thead>
            <tr className="border-b-2 border-zinc-900 text-[10px] uppercase tracking-wider text-zinc-500">
              <th className="text-right py-2 pl-2 font-medium">פריט</th>
              <th className="text-right py-2 font-medium w-24">מק&quot;ט / מידה</th>
              <th className="text-center py-2 font-medium w-16">כמות</th>
              <th className="text-left py-2 pr-2 font-medium w-28">מחיר ליחידה</th>
              <th className="text-left py-2 pr-2 font-medium w-28">סה&quot;כ</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-zinc-200">
                <td className="py-3 pl-2">
                  <div className="flex items-center gap-3">
                    <div className="relative size-12 shrink-0 overflow-hidden border border-zinc-200">
                      {item.image && (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <span className="font-medium text-sm">{item.name}</span>
                  </div>
                </td>
                <td className="py-3 text-xs text-zinc-600 font-mono">
                  {item.size ? item.size : "—"}
                </td>
                <td className="py-3 text-center tabular-nums font-semibold">{item.qty}</td>
                <td className="py-3 pr-2 text-left tabular-nums">{formatPrice(item.price)}</td>
                <td className="py-3 pr-2 text-left tabular-nums font-semibold">
                  {formatPrice(item.price * item.qty)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-72 space-y-1.5 text-sm">
            <Row label="סה״כ פריטים" value={String(totalQty)} />
            <Row label="ביניים" value={formatPrice(order.subtotal)} />
            {order.discount > 0 && (
              <Row
                label={`הנחה${order.couponCode ? ` (${order.couponCode})` : ""}`}
                value={`-${formatPrice(order.discount)}`}
              />
            )}
            <Row
              label="משלוח"
              value={order.shippingCost === 0 ? "חינם" : formatPrice(order.shippingCost)}
            />
            <div className="flex justify-between items-baseline pt-2 mt-2 border-t-2 border-zinc-900">
              <span className="font-semibold">סה״כ</span>
              <span className="text-xl font-semibold tabular-nums">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-zinc-200 text-center text-[10px] text-zinc-500 leading-relaxed">
          תודה שקנית ב-{siteConfig.name} ❀ נשמח לשמוע ממך · {siteConfig.contact.email}
          <br />
          {siteConfig.url}
        </footer>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline text-zinc-700">
      <span>{label}</span>
      <span className="tabular-nums font-medium">{value}</span>
    </div>
  );
}
