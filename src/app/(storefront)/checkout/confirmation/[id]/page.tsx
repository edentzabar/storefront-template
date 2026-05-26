import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { getOrderForCustomer } from "@/lib/orders-actions";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "אישור הזמנה",
  description: "ההזמנה שלך התקבלה.",
  robots: { index: false, follow: false },
};

type Params = { params: Promise<{ id: string }> };

export default async function ConfirmationPage({ params }: Params) {
  const { id } = await params;
  const order = await getOrderForCustomer(id);

  return (
    <>
      <Breadcrumbs items={[{ label: "בית", href: "/" }, { label: "אישור הזמנה" }]} />
      <main className="py-16 px-6 lg:px-10">
        {!order ? (
          <div className="max-w-[640px] mx-auto text-center">
            <p className="text-brand-text-soft mb-6">ההזמנה לא נמצאה.</p>
            <Link
              href="/"
              className="inline-block px-10 py-4 bg-brand-primary text-white text-[0.76rem] tracking-[0.2em] uppercase font-medium hover:bg-brand-primary-soft transition-colors no-underline"
            >
              חזרה לחנות
            </Link>
          </div>
        ) : (
          <div className="max-w-[720px] mx-auto text-center">
            <CheckCircle2 className="w-16 h-16 mx-auto text-brand-accent mb-5" strokeWidth={1} />
            <h1 className="font-body text-3xl font-light text-brand-primary mb-3">
              תודה, ההזמנה התקבלה!
            </h1>
            <p className="text-brand-text-soft mb-10">
              מספר הזמנה: <span className="font-medium text-brand-primary">{order.id}</span>
              <br />
              אישור נשלח ל-{order.customerEmail}
            </p>

            <div className="text-right bg-brand-surface border border-brand-border p-7 mb-10">
              <h2 className="font-body text-lg font-medium mb-4 text-brand-primary">פרטי ההזמנה</h2>
              <ul className="space-y-2.5 mb-5 text-sm">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span>
                      {item.name} {item.size && `(${item.size})`} × {item.qty}
                    </span>
                    <span>{formatPrice(item.price * item.qty)}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-brand-border pt-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-brand-text-soft">
                  <span>ביניים</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-brand-text-soft">
                  <span>משלוח</span>
                  <span>{order.shippingCost === 0 ? "חינם" : formatPrice(order.shippingCost)}</span>
                </div>
                <div className="flex justify-between font-medium pt-2 mt-2 border-t border-brand-border">
                  <span>סה"כ</span>
                  <span className="font-display text-xl">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>

            <Link
              href="/"
              className="inline-block px-10 py-4 bg-brand-primary text-white text-[0.76rem] tracking-[0.2em] uppercase font-medium hover:bg-brand-primary-soft transition-colors no-underline"
            >
              חזרה לחנות
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
