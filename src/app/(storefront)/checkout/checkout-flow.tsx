"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Check, X, Tag } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/stores/cart-store";
import { placeOrder, validateCouponForCart } from "@/lib/orders-actions";
import { saveAbandonedCart } from "@/lib/abandoned-cart-actions";
import { formatPrice } from "@/lib/format";
import { siteConfig } from "@/lib/site-config";

type Step = "details" | "shipping" | "payment";

type Customer = { fullName: string; email: string; phone: string };
type ShippingState = {
  method: "standard" | "express" | "pickup";
  address: string;
  city: string;
  zip: string;
  notes: string;
};
type PaymentState = { method: "card" | "bit" | "applepay" | "googlepay" };

export function CheckoutFlow() {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.total());
  const clearCart = useCart((s) => s.clear);
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>("details");
  const [submitting, setSubmitting] = useState(false);

  const [customer, setCustomer] = useState<Customer>({
    fullName: "",
    email: "",
    phone: "",
  });

  const [shipping, setShipping] = useState<ShippingState>({
    method: "standard",
    address: "",
    city: "",
    zip: "",
    notes: "",
  });

  const [payment, setPayment] = useState<PaymentState>({ method: "card" });
  const [cardNumber, setCardNumber] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);

  useEffect(() => setMounted(true), []);

  const shippingCost =
    shipping.method === "express"
      ? 35
      : shipping.method === "pickup"
      ? 0
      : total >= siteConfig.shop.freeShippingMin
      ? 0
      : 30;
  const discountAmount = appliedCoupon?.discount ?? 0;
  const finalTotal = Math.max(0, total - discountAmount) + shippingCost;

  if (mounted && items.length === 0 && !submitting) {
    return (
      <div className="text-center py-16">
        <p className="text-brand-text-soft mb-6">העגלה ריקה</p>
        <Link
          href="/"
          className="inline-block px-10 py-4 bg-brand-primary text-white text-[0.76rem] tracking-[0.2em] uppercase font-medium hover:bg-brand-primary-soft transition-colors no-underline"
        >
          חזרה לחנות
        </Link>
      </div>
    );
  }

  function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    // Persist cart to DB for abandoned-cart recovery. Fire-and-forget — we don't
    // want a network blip to block the user from moving to the next step.
    if (customer.email && items.length > 0) {
      saveAbandonedCart({
        email: customer.email,
        customerName: customer.fullName || null,
        items: items.map((i) => ({
          id: i.id,
          slug: i.slug,
          name: i.name,
          image: i.image,
          size: i.size,
          price: i.price,
          qty: i.qty,
        })),
      }).catch(() => {
        // silent — recovery is nice-to-have, never break checkout for it
      });
    }
    setStep("shipping");
  }

  function submitShipping(e: React.FormEvent) {
    e.preventDefault();
    setStep("payment");
  }

  async function submitOrder(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const result = await placeOrder({
      customer,
      shipping: {
        method: shipping.method,
        address: shipping.address || null,
        city: shipping.city || null,
        zip: shipping.zip || null,
        notes: shipping.notes || null,
      },
      payment: {
        method: payment.method,
        cardNumber: payment.method === "card" ? cardNumber : null,
      },
      items: items.map((i) => ({
        id: i.id,
        slug: i.slug,
        name: i.name,
        price: i.price,
        image: i.image,
        size: i.size,
        qty: i.qty,
      })),
      couponCode: appliedCoupon?.code ?? null,
    });
    if (!result.ok) {
      toast.error(result.error);
      setSubmitting(false);
      return;
    }
    clearCart();
    router.push(`/checkout/confirmation/${result.orderId}`);
  }

  return (
    <>
      <TestModeBanner />
      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-10">
      <div>
        <div className="flex items-center gap-2 mb-10">
          <StepDot active={step === "details"} done={step !== "details"} num={1} label="פרטים" />
          <StepLine />
          <StepDot active={step === "shipping"} done={step === "payment"} num={2} label="משלוח" />
          <StepLine />
          <StepDot active={step === "payment"} done={false} num={3} label="תשלום" />
        </div>

        {step === "details" && (
          <form onSubmit={submitDetails} className="space-y-5">
            <h2 className="font-body text-xl font-medium text-brand-primary mb-4">
              פרטים אישיים
            </h2>
            <Field
              label="שם מלא"
              required
              value={customer.fullName}
              onChange={(v) => setCustomer((c) => ({ ...c, fullName: v }))}
            />
            <Field
              label="אימייל"
              type="email"
              required
              value={customer.email}
              onChange={(v) => setCustomer((c) => ({ ...c, email: v }))}
            />
            <Field
              label="טלפון"
              type="tel"
              required
              value={customer.phone}
              onChange={(v) => setCustomer((c) => ({ ...c, phone: v }))}
            />
            <button
              type="submit"
              className="w-full bg-brand-primary text-white text-[0.78rem] tracking-[0.2em] uppercase font-medium py-4 hover:bg-brand-primary-soft transition-colors mt-4"
            >
              המשך לשיטת משלוח
            </button>
          </form>
        )}

        {step === "shipping" && (
          <form onSubmit={submitShipping} className="space-y-5">
            <h2 className="font-body text-xl font-medium text-brand-primary mb-4">
              שיטת משלוח
            </h2>
            <div className="space-y-3">
              {[
                { method: "standard" as const, label: "משלוח רגיל (2-4 ימי עסקים)", price: total >= siteConfig.shop.freeShippingMin ? "חינם" : "₪30" },
                { method: "express" as const, label: "אקספרס 24 שעות", price: "₪35" },
                { method: "pickup" as const, label: "איסוף עצמי מהסטודיו (תל אביב)", price: "חינם" },
              ].map((opt) => (
                <label
                  key={opt.method}
                  className={`block p-4 border cursor-pointer transition-colors ${
                    shipping.method === opt.method
                      ? "border-brand-primary bg-brand-bg-soft"
                      : "border-brand-border hover:border-brand-text"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="ship"
                        checked={shipping.method === opt.method}
                        onChange={() => setShipping((s) => ({ ...s, method: opt.method }))}
                        className="accent-brand-primary"
                      />
                      <span className="font-medium">{opt.label}</span>
                    </div>
                    <span className="text-brand-accent">{opt.price}</span>
                  </div>
                </label>
              ))}
            </div>

            {shipping.method !== "pickup" && (
              <>
                <Field
                  label="כתובת מלאה"
                  required
                  value={shipping.address}
                  onChange={(v) => setShipping((s) => ({ ...s, address: v }))}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="עיר"
                    required
                    value={shipping.city}
                    onChange={(v) => setShipping((s) => ({ ...s, city: v }))}
                  />
                  <Field
                    label="מיקוד"
                    value={shipping.zip}
                    onChange={(v) => setShipping((s) => ({ ...s, zip: v }))}
                  />
                </div>
              </>
            )}

            <Field
              label="הערות (אופציונלי)"
              value={shipping.notes}
              onChange={(v) => setShipping((s) => ({ ...s, notes: v }))}
            />
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setStep("details")}
                className="px-6 py-4 border border-brand-border text-[0.78rem] tracking-[0.2em] uppercase font-medium hover:bg-brand-bg-soft transition-colors"
              >
                חזרה
              </button>
              <button
                type="submit"
                className="flex-1 bg-brand-primary text-white text-[0.78rem] tracking-[0.2em] uppercase font-medium py-4 hover:bg-brand-primary-soft transition-colors"
              >
                המשך לתשלום
              </button>
            </div>
          </form>
        )}

        {step === "payment" && (
          <form onSubmit={submitOrder} className="space-y-5">
            <h2 className="font-body text-xl font-medium text-brand-primary mb-4">
              אמצעי תשלום
            </h2>
            <div className="space-y-3">
              {[
                { method: "card" as const, label: "כרטיס אשראי" },
                { method: "bit" as const, label: "Bit" },
                { method: "applepay" as const, label: "Apple Pay" },
                { method: "googlepay" as const, label: "Google Pay" },
              ].map((opt) => (
                <label
                  key={opt.method}
                  className={`block p-4 border cursor-pointer transition-colors ${
                    payment.method === opt.method
                      ? "border-brand-primary bg-brand-bg-soft"
                      : "border-brand-border hover:border-brand-text"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="pay"
                      checked={payment.method === opt.method}
                      onChange={() => setPayment({ method: opt.method })}
                      className="accent-brand-primary"
                    />
                    <span className="font-medium">{opt.label}</span>
                  </div>
                </label>
              ))}
            </div>

            {payment.method === "card" && (
              <div className="bg-brand-bg-soft p-5 space-y-4">
                <Field
                  label="מספר כרטיס"
                  placeholder="4111 1111 1111 1111"
                  required
                  value={cardNumber}
                  onChange={setCardNumber}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="תוקף" placeholder="MM/YY" />
                  <Field label="CVV" placeholder="•••" />
                </div>
              </div>
            )}

            <TestCardsBox onUseCard={(n) => { setPayment({ method: "card" }); setCardNumber(n); }} />

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setStep("shipping")}
                disabled={submitting}
                className="px-6 py-4 border border-brand-border text-[0.78rem] tracking-[0.2em] uppercase font-medium hover:bg-brand-bg-soft transition-colors disabled:opacity-50"
              >
                חזרה
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-brand-primary text-white text-[0.78rem] tracking-[0.2em] uppercase font-medium py-4 hover:bg-brand-primary-soft transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    מעבד תשלום…
                  </>
                ) : (
                  `שלח הזמנה · ${formatPrice(finalTotal)}`
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      <OrderSummary
        items={items}
        subtotal={total}
        shippingCost={shippingCost}
        appliedCoupon={appliedCoupon}
        onApplyCoupon={setAppliedCoupon}
      />
      </div>
    </>
  );
}

// ---------- test-mode UI ----------

function TestModeBanner() {
  return (
    <div className="bg-brand-accent/10 border border-brand-accent/30 px-4 py-3 mb-6 text-[0.85rem] text-brand-accent-dark text-center">
      <strong className="font-medium">🧪 מצב טסט</strong>
      {" — "}
      תשלומים מדומים. אף כסף אמיתי לא יחויב. ראה{" "}
      <a href="#test-cards" className="underline">כרטיסי הטסט</a> למטה.
    </div>
  );
}

function TestCardsBox({ onUseCard }: { onUseCard: (cardNumber: string) => void }) {
  const cards = [
    { label: "הצלחה", number: "4111 1111 1111 1111", desc: "התשלום יאושר" },
    { label: "סירוב הבנק", number: "4000 0000 0000 0002", desc: "הכרטיס יידחה" },
    { label: "אין יתרה", number: "4000 0000 0000 9995", desc: "אין מספיק יתרה" },
    { label: "פג תוקף", number: "4000 0000 0000 0069", desc: "הכרטיס פג תוקף" },
  ];
  return (
    <details id="test-cards" className="border border-dashed border-brand-border bg-white/50 mt-4">
      <summary className="cursor-pointer px-4 py-3 text-[0.85rem] text-brand-text-soft hover:text-brand-primary">
        🧪 כרטיסי טסט (לחץ כדי לפתוח)
      </summary>
      <div className="border-t border-brand-border p-4 space-y-2">
        <p className="text-[0.8rem] text-brand-text-soft mb-3">
          לחץ על כרטיס כדי למלא אוטומטית. בטוח להשתמש — אף תשלום אמיתי לא יבוצע.
        </p>
        {cards.map((c) => (
          <button
            key={c.number}
            type="button"
            onClick={() => onUseCard(c.number)}
            className="w-full flex justify-between items-center gap-3 px-3 py-2.5 border border-brand-border bg-white hover:border-brand-accent transition-colors text-right"
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-brand-primary">{c.label}</div>
              <div className="text-xs text-brand-text-soft">{c.desc}</div>
            </div>
            <code className="text-xs font-mono text-brand-text-soft" dir="ltr">{c.number}</code>
          </button>
        ))}
        <p className="text-[0.75rem] text-brand-text-soft pt-2">
          תוקף ו-CVV: כל ערך עובד. עבור Bit / Apple Pay / Google Pay — תמיד מצליח במצב טסט.
        </p>
      </div>
    </details>
  );
}

function Field({
  label,
  value = "",
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value?: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[0.78rem] tracking-[0.1em] uppercase text-brand-text-soft mb-1.5 block">
        {label}
        {required && <span className="text-destructive mr-1">*</span>}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-brand-border bg-white focus:outline-none focus:border-brand-primary text-[0.95rem]"
      />
    </label>
  );
}

function StepDot({ num, label, active, done }: { num: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-8 h-8 rounded-full inline-flex items-center justify-center text-sm font-medium ${
          done
            ? "bg-brand-accent text-white"
            : active
            ? "bg-brand-primary text-white"
            : "bg-brand-bg-soft text-brand-text-soft"
        }`}
      >
        {done ? <Check className="w-4 h-4" /> : num}
      </div>
      <span className={`text-sm ${active || done ? "text-brand-primary font-medium" : "text-brand-text-soft"}`}>
        {label}
      </span>
    </div>
  );
}

function StepLine() {
  return <div className="flex-1 h-px bg-brand-border" />;
}

function OrderSummary({
  items,
  subtotal,
  shippingCost,
  appliedCoupon,
  onApplyCoupon,
}: {
  items: ReturnType<typeof useCart.getState>["items"];
  subtotal: number;
  shippingCost: number;
  appliedCoupon: { code: string; discount: number } | null;
  onApplyCoupon: (c: { code: string; discount: number } | null) => void;
}) {
  const discount = appliedCoupon?.discount ?? 0;
  const total = Math.max(0, subtotal - discount) + shippingCost;
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start bg-brand-surface p-6 border border-brand-border">
      <h3 className="font-body text-lg font-medium mb-4 text-brand-primary">
        סיכום ההזמנה
      </h3>
      <ul className="space-y-3 max-h-80 overflow-y-auto mb-4">
        {items.map((item) => (
          <li key={item.key} className="flex gap-3 text-sm">
            <div className="relative w-14 h-16 flex-shrink-0 overflow-hidden bg-brand-bg-soft">
              <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-brand-primary line-clamp-1">{item.name}</div>
              <div className="text-brand-text-soft text-xs">
                כמות {item.qty}{item.size ? ` · מידה ${item.size}` : ""}
              </div>
            </div>
            <div className="text-brand-primary">{formatPrice(item.price * item.qty)}</div>
          </li>
        ))}
      </ul>

      <CouponInput
        subtotal={subtotal}
        applied={appliedCoupon}
        onChange={onApplyCoupon}
      />

      <div className="border-t border-brand-border pt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-brand-text-soft">ביניים</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {appliedCoupon && (
          <div className="flex justify-between text-brand-accent-dark">
            <span>
              הנחה ({appliedCoupon.code})
            </span>
            <span>−{formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-brand-text-soft">משלוח</span>
          <span>{shippingCost === 0 ? "חינם" : formatPrice(shippingCost)}</span>
        </div>
        <div className="flex justify-between items-baseline pt-3 mt-2 border-t border-brand-border">
          <span className="font-medium">סה&quot;כ</span>
          <span className="font-display text-2xl text-brand-primary">{formatPrice(total)}</span>
        </div>
      </div>
    </aside>
  );
}

function CouponInput({
  subtotal,
  applied,
  onChange,
}: {
  subtotal: number;
  applied: { code: string; discount: number } | null;
  onChange: (c: { code: string; discount: number } | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [pending, startTransition] = useTransition();

  function apply(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    startTransition(async () => {
      const result = await validateCouponForCart(code.trim(), subtotal);
      if (result.ok) {
        onChange({ code: result.applied.code, discount: result.applied.discount });
        setCode("");
        setOpen(false);
        toast.success("הקופון הוחל בהצלחה");
      } else {
        toast.error(result.error);
      }
    });
  }

  if (applied) {
    return (
      <div className="mb-4 -mx-2 px-3 py-2.5 bg-brand-accent/10 border border-brand-accent/30 flex items-center gap-2 text-sm">
        <Tag className="size-4 text-brand-accent-dark" />
        <div className="flex-1">
          <div className="font-medium text-brand-accent-dark font-mono">{applied.code}</div>
          <div className="text-xs text-brand-text-soft">
            הנחה −{formatPrice(applied.discount)}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-brand-text-soft hover:text-destructive transition-colors"
          aria-label="הסר קופון"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-4 inline-flex items-center gap-2 text-xs text-brand-text-soft hover:text-brand-accent transition-colors"
      >
        <Tag className="size-3.5" />
        יש לי קוד הנחה
      </button>
    );
  }

  return (
    <form onSubmit={apply} className="mb-4 flex gap-2">
      <input
        autoFocus
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="קוד הנחה"
        className="flex-1 px-3 py-2 border border-brand-border bg-white text-sm font-mono uppercase focus:outline-none focus:border-brand-primary"
        disabled={pending}
        maxLength={40}
      />
      <button
        type="submit"
        disabled={pending || !code.trim()}
        className="px-4 py-2 bg-brand-primary text-white text-xs tracking-[0.15em] uppercase font-medium hover:bg-brand-primary-soft transition-colors disabled:opacity-50"
      >
        {pending ? "..." : "החל"}
      </button>
    </form>
  );
}
