"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Printer, ChevronRight } from "lucide-react";

/**
 * Auto-prompts the print dialog on load, but only on first visit (not on every refresh).
 * Also renders an in-page toolbar with a manual print button + back link, hidden when printing.
 */
export function PrintTrigger() {
  useEffect(() => {
    // Delay slightly so images can load
    const t = window.setTimeout(() => {
      window.print();
    }, 400);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="print:hidden sticky top-0 z-50 bg-zinc-900 text-white px-6 py-3 flex items-center justify-between">
      <Link
        href="javascript:history.back()"
        className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white no-underline"
      >
        <ChevronRight className="size-4 rotate-180" />
        חזרה
      </Link>
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 bg-white text-zinc-900 px-4 py-1.5 rounded-md text-sm font-medium hover:bg-white/90"
      >
        <Printer className="size-4" />
        הדפס
      </button>
    </div>
  );
}
