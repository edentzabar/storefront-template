"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { signUp } from "@/lib/auth-client";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await signUp.email({
      name,
      email,
      password,
      // additional field
      phone,
    } as Parameters<typeof signUp.email>[0]);
    if (error) {
      // SECURITY: Don't echo the raw error — could expose whether the
      // email is already registered (account enumeration). Keep the
      // detail in the server log; show a generic message here.
      setError("יצירת החשבון נכשלה. בדקי שכל הפרטים תקינים.");
      setBusy(false);
      return;
    }
    // Email verification is disabled — better-auth auto-signs the
    // new user in (`autoSignIn: true`), so we go straight to /account.
    toast.success("החשבון נוצר בהצלחה");
    router.push("/account");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-brand-border p-8">
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 border border-destructive/20">
          {error}
        </div>
      )}
      <label className="block">
        <span className="text-[0.78rem] tracking-[0.1em] uppercase text-brand-text-soft mb-1.5 block">שם מלא</span>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 border border-brand-border bg-white focus:outline-none focus:border-brand-primary"
        />
      </label>
      <label className="block">
        <span className="text-[0.78rem] tracking-[0.1em] uppercase text-brand-text-soft mb-1.5 block">אימייל</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-brand-border bg-white focus:outline-none focus:border-brand-primary"
        />
      </label>
      <label className="block">
        <span className="text-[0.78rem] tracking-[0.1em] uppercase text-brand-text-soft mb-1.5 block">טלפון</span>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-4 py-3 border border-brand-border bg-white focus:outline-none focus:border-brand-primary"
        />
      </label>
      <label className="block">
        <span className="text-[0.78rem] tracking-[0.1em] uppercase text-brand-text-soft mb-1.5 block">
          סיסמה <span className="text-brand-text-soft normal-case tracking-normal">(לפחות 12 תווים)</span>
        </span>
        <input
          type="password"
          required
          minLength={12}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 border border-brand-border bg-white focus:outline-none focus:border-brand-primary"
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="w-full bg-brand-primary text-white text-[0.78rem] tracking-[0.2em] uppercase font-medium py-4 hover:bg-brand-primary-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {busy ? "יוצר חשבון…" : "צור חשבון"}
      </button>
      <p className="text-center text-sm pt-2 border-t border-brand-border">
        כבר יש לך חשבון?{" "}
        <Link href="/account/login" className="text-brand-accent hover:underline">
          התחבר
        </Link>
      </p>
    </form>
  );
}
