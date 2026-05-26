"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { signIn } from "@/lib/auth-client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await signIn.email({ email, password });
    if (error) {
      setError(error.message ?? "ההתחברות נכשלה. בדקו את הפרטים.");
      setBusy(false);
      return;
    }
    toast.success("התחברת בהצלחה");
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
        <span className="text-[0.78rem] tracking-[0.1em] uppercase text-brand-text-soft mb-1.5 block">סיסמה</span>
        <input
          type="password"
          required
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
        {busy ? "מתחבר…" : "התחבר"}
      </button>
      <p className="text-center text-sm pt-2 border-t border-brand-border">
        אין לך חשבון?{" "}
        <Link href="/account/register" className="text-brand-accent hover:underline">
          הרשם כאן
        </Link>
      </p>
    </form>
  );
}
