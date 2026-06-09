"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, ShieldCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { Prisma } from "@prisma/client";
import { signOut } from "@/lib/auth-client";
import { formatPrice } from "@/lib/format";
import { deleteMyAccount } from "@/lib/account-actions";

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
  // Two-step delete UX: open a modal, customer types DELETE in
  // Hebrew ("מחק") to confirm. Prevents fat-finger account loss.
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleLogout() {
    await signOut();
    toast.success("התנתקת");
    router.push("/");
    router.refresh();
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    const result = await deleteMyAccount();
    if (!result.ok) {
      toast.error(result.error);
      setDeleting(false);
      return;
    }
    // Account is gone — sign out the now-orphaned session and
    // bounce the user to the homepage.
    await signOut();
    toast.success("החשבון נמחק");
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

      {/* Danger zone — account deletion (GDPR / Israeli privacy law) */}
      <div className="border border-destructive/20 bg-destructive/5 p-6 mt-12">
        <h3 className="font-body text-base font-medium text-destructive mb-2 inline-flex items-center gap-2">
          <AlertTriangle className="size-4" />
          מחיקת חשבון
        </h3>
        <p className="text-sm text-brand-text-soft mb-4 leading-relaxed">
          ההזמנות הקודמות יישמרו ברישומי החנות (חובה משפטית למסמכי
          חשבוניות), אבל לא תוכלי לראות אותן יותר. הפרטים האישיים שלך
          (אימייל, סיסמה, כתובות שמורות) יימחקו לצמיתות.
        </p>
        <button
          type="button"
          onClick={() => {
            setDeleteOpen(true);
            setDeleteConfirm("");
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-destructive text-destructive text-[0.76rem] tracking-[0.15em] uppercase font-medium hover:bg-destructive hover:text-white transition-colors"
        >
          מחקי את החשבון שלי
        </button>
      </div>

      {/* Delete confirmation modal */}
      {deleteOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4"
          onClick={() => !deleting && setDeleteOpen(false)}
        >
          <div
            className="bg-white max-w-md w-full p-6 border border-brand-border"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="font-body text-lg font-medium text-destructive mb-2 inline-flex items-center gap-2">
              <AlertTriangle className="size-5" />
              לאשר מחיקה?
            </h4>
            <p className="text-sm text-brand-text mb-4 leading-relaxed">
              אחרי המחיקה לא נוכל לשחזר את החשבון. כדי לאשר, הקלידי
              <strong className="text-brand-primary"> מחק </strong>
              בשדה למטה.
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="מחק"
              autoFocus
              disabled={deleting}
              className="w-full px-4 py-3 border border-brand-border bg-white text-center text-base focus:outline-none focus:border-destructive mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
                className="px-4 py-2.5 border border-brand-border text-[0.76rem] tracking-[0.15em] uppercase font-medium hover:bg-brand-bg-soft transition-colors disabled:opacity-50"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirm.trim() !== "מחק"}
                className="px-4 py-2.5 bg-destructive text-white text-[0.76rem] tracking-[0.15em] uppercase font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "מוחק..." : "מחק לצמיתות"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
