"use client";

import { useState } from "react";
import { Bell, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { joinRestockWaitlist } from "@/lib/restock-actions";

/**
 * Shown on product detail pages when stock === 0. Captures an email
 * for the restock waitlist. After submit the form collapses into a
 * confirmation state — same component, no page reload.
 */
export function RestockForm({ productId }: { productId: string }) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    const r = await joinRestockWaitlist({ productId, email });
    setSubmitting(false);
    if (r.ok) {
      setDone(true);
    } else {
      toast.error(r.error ?? "שגיאה ברישום");
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border border-brand-accent/30 bg-brand-bg-soft/60 px-4 py-3.5 flex items-start gap-3">
        <CheckCircle2 className="size-5 text-brand-accent shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="text-sm font-medium text-brand-primary mb-0.5">
            נרשמת בהצלחה
          </div>
          <p className="text-[0.82rem] text-brand-text-soft leading-relaxed">
            נשלח לך מייל ברגע שהמוצר חוזר למלאי. אפשר לסגור את החלון.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-brand-border bg-brand-bg-soft/40 px-4 py-3.5">
      <div className="flex items-center gap-2 mb-1.5">
        <Bell className="size-4 text-brand-accent" />
        <h3 className="text-sm font-medium text-brand-primary">
          להודיע לי כשחוזר למלאי
        </h3>
      </div>
      <p className="text-[0.78rem] text-brand-text-soft leading-relaxed mb-3">
        השאירי כתובת ונשלח מייל ברגע שהמוצר חוזר.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="האימייל שלך"
          dir="ltr"
          className="flex-1 min-w-0 px-3 py-2 bg-white border border-brand-border rounded-md text-sm text-end focus:outline-none focus:border-brand-accent"
        />
        <button
          type="submit"
          disabled={submitting || !email.trim()}
          className="shrink-0 inline-flex items-center gap-1.5 bg-brand-accent text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-brand-accent-dark transition-colors disabled:opacity-60"
        >
          {submitting && <Loader2 className="size-4 animate-spin" />}
          הוסיפי אותי
        </button>
      </form>
    </div>
  );
}
