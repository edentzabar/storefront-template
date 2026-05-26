"use client";

import { useState } from "react";
import { toast } from "sonner";

export function ContactForm() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: POST to /api/contact in next round
    setSent(true);
    toast.success("ההודעה נשלחה. נחזור אליך בקרוב.");
  }

  if (sent) {
    return (
      <div className="bg-brand-surface border border-brand-border p-10 text-center">
        <h2 className="font-body text-xl font-medium text-brand-primary mb-2">
          תודה!
        </h2>
        <p className="text-brand-text-soft">קיבלנו את ההודעה ונחזור אליך בקרוב.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-brand-border p-8">
      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="text-[0.78rem] tracking-[0.1em] uppercase text-brand-text-soft mb-1.5 block">
            שם מלא <span className="text-destructive">*</span>
          </span>
          <input
            type="text"
            required
            className="w-full px-4 py-3 border border-brand-border bg-white focus:outline-none focus:border-brand-primary"
          />
        </label>
        <label className="block">
          <span className="text-[0.78rem] tracking-[0.1em] uppercase text-brand-text-soft mb-1.5 block">
            טלפון
          </span>
          <input
            type="tel"
            className="w-full px-4 py-3 border border-brand-border bg-white focus:outline-none focus:border-brand-primary"
          />
        </label>
      </div>
      <label className="block">
        <span className="text-[0.78rem] tracking-[0.1em] uppercase text-brand-text-soft mb-1.5 block">
          אימייל <span className="text-destructive">*</span>
        </span>
        <input
          type="email"
          required
          className="w-full px-4 py-3 border border-brand-border bg-white focus:outline-none focus:border-brand-primary"
        />
      </label>
      <label className="block">
        <span className="text-[0.78rem] tracking-[0.1em] uppercase text-brand-text-soft mb-1.5 block">
          נושא
        </span>
        <select className="w-full px-4 py-3 border border-brand-border bg-white focus:outline-none focus:border-brand-primary">
          <option>שאלה על מוצר</option>
          <option>עיצוב אישי</option>
          <option>תיקון / שירות</option>
          <option>שיתוף פעולה</option>
          <option>אחר</option>
        </select>
      </label>
      <label className="block">
        <span className="text-[0.78rem] tracking-[0.1em] uppercase text-brand-text-soft mb-1.5 block">
          הודעה <span className="text-destructive">*</span>
        </span>
        <textarea
          required
          rows={5}
          className="w-full px-4 py-3 border border-brand-border bg-white focus:outline-none focus:border-brand-primary resize-none"
        />
      </label>
      <button
        type="submit"
        className="w-full bg-brand-primary text-white text-[0.78rem] tracking-[0.2em] uppercase font-medium py-4 hover:bg-brand-primary-soft transition-colors"
      >
        שלח הודעה
      </button>
    </form>
  );
}
