"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { Prisma } from "@prisma/client";
import { signOut } from "@/lib/auth-client";
import { formatPrice } from "@/lib/format";

const STATUS_LABELS: Record<string, string> = {
  new: "חדשה",
  processing: "בטיפול",
  shipped: "נשלחה",
  delivered: "סופקה",
  cancelled: "בוטלה",
};

type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: true } }>;

type Props = {
  user: { name: string; email: string; phone: string; role: string };
  orders: OrderWithItems[];
};

export function AccountView({ user, orders }: Props) {
  const router = useRouter();

  async function handleLogout() {
    await signOut();
    toast.success("התנתקת");
    router.push("/");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {/* Profile card */}
      <div className="bg-brand-surface border border-brand-border p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1.5">
            <h2 className="font-body text-lg font-medium text-brand-primary">פרטי החשבון</h2>
            <div className="text-sm text-brand-text-soft">{user.name}</div>
            <div className="text-sm text-brand-text-soft">{user.email}</div>
            {user.phone && <div className="text-sm text-brand-text-soft">{user.phone}</div>}
          </div>
          <div className="flex flex-col gap-2 items-stretch">
            {user.role === "admin" && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-accent text-white text-[0.76rem] tracking-[0.15em] uppercase font-medium hover:bg-brand-accent-dark transition-colors no-underline"
              >
                <ShieldCheck className="w-4 h-4" />
                ניהול האתר
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-brand-border text-[0.76rem] tracking-[0.15em] uppercase font-medium hover:bg-brand-bg-soft transition-colors"
            >
              <LogOut className="w-4 h-4" />
              התנתק
            </button>
          </div>
        </div>
      </div>

      {/* Orders */}
      <div>
        <h2 className="font-body text-xl font-medium mb-6 text-brand-primary">
          ההזמנות שלי
        </h2>
        {orders.length === 0 ? (
          <div className="bg-brand-surface border border-brand-border p-10 text-center">
            <p className="text-brand-text-soft mb-6">
              אין עדיין הזמנות. כשתבצע הזמנה, תוכל לראות את הסטטוס כאן.
            </p>
            <Link
              href="/"
              className="inline-block px-10 py-4 bg-brand-primary text-white text-[0.76rem] tracking-[0.2em] uppercase font-medium hover:bg-brand-primary-soft transition-colors no-underline"
            >
              לקולקציה
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border border-brand-border bg-white p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4 pb-3 border-b border-brand-border">
                  <div>
                    <div className="font-medium text-brand-primary">הזמנה #{order.id}</div>
                    <div className="text-xs text-brand-text-soft mt-1">
                      {new Date(order.createdAt).toLocaleDateString("he-IL", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 text-xs bg-brand-bg-soft text-brand-primary tracking-wider uppercase">
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </div>
                <ul className="space-y-2 text-sm mb-3">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex justify-between text-brand-text-soft">
                      <span>
                        {item.name} {item.size && `(${item.size})`} × {item.qty}
                      </span>
                      <span>{formatPrice(item.price * item.qty)}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between text-sm font-medium pt-3 border-t border-brand-border">
                  <span>סה"כ</span>
                  <span className="font-display text-lg">{formatPrice(order.total)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
