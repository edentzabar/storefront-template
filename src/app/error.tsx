"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Global error boundary for the storefront. Catches unhandled errors
 * thrown during render so visitors see a graceful message instead of
 * a Next.js stack trace. The stack DOES leak only in dev (Next shows
 * the overlay anyway) — in prod, only the digest is visible to the
 * user so we don't leak source-line info, and the full error goes
 * to the server logs (Vercel / Sentry / etc).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server-side instrumentation should already have captured this;
    // log the digest in the browser as a backup pointer.
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[storefront] uncaught:", error);
    }
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-20">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl text-brand-primary mb-3">משהו השתבש</h1>
        <p className="text-brand-text-soft mb-6 leading-relaxed">
          נתקלנו בבעיה בלתי צפויה. כבר תיעדנו את התקלה ונתקן בקרוב.
        </p>
        {error.digest && (
          <p className="text-[11px] text-brand-text-soft/70 mb-6 font-mono">
            מזהה תקלה: {error.digest}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="px-6 py-3 bg-brand-primary text-white text-[0.78rem] tracking-[0.18em] uppercase font-medium hover:bg-brand-primary-soft transition-colors"
          >
            נסה שוב
          </button>
          <Link
            href="/"
            className="px-6 py-3 border border-brand-border text-brand-primary text-[0.78rem] tracking-[0.18em] uppercase font-medium hover:bg-brand-bg-soft transition-colors no-underline"
          >
            דף הבית
          </Link>
        </div>
      </div>
    </div>
  );
}
