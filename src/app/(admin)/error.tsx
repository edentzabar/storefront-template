"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Admin error boundary. Same pattern as the storefront one but
 * styled for the admin theme (Shadcn tokens). The digest is the only
 * identifier we expose; full error stays in server logs.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[admin] uncaught:", error);
    }
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-20">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-medium tracking-tight text-foreground mb-2">
          משהו השתבש
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          התקלה תועדה. נסי שוב או חזרי לדשבורד.
        </p>
        {error.digest && (
          <p className="text-[11px] text-muted-foreground/70 mb-6 font-mono">
            מזהה תקלה: {error.digest}
          </p>
        )}
        <div className="flex gap-2 justify-center">
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 bg-foreground text-background text-sm rounded-md hover:bg-foreground/90 transition-colors"
          >
            נסה שוב
          </button>
          <Link
            href="/admin"
            className="px-4 py-2 border border-border text-foreground text-sm rounded-md hover:bg-muted transition-colors no-underline"
          >
            לדשבורד
          </Link>
        </div>
      </div>
    </div>
  );
}
