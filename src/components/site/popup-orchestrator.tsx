"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { X, Tag, Copy, Check } from "lucide-react";
import type { ActivePopup } from "@/lib/popups";

type Props = {
  popups: ActivePopup[];
  /** Whether the visitor is currently signed in. Passed from the server. */
  isAuthenticated: boolean;
};

const STORAGE_PREFIX = "app.popup.seen.";

function pageTypeForPath(pathname: string): "home" | "product" | "category" | "other" {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/product/")) return "product";
  if (pathname.startsWith("/category/")) return "category";
  return "other";
}

/**
 * Returns true if the popup is allowed to show right now given the visitor's
 * "seen" history in storage. Side-effect free.
 */
function isFreshFor(popup: ActivePopup): boolean {
  if (typeof window === "undefined") return false;
  const key = STORAGE_PREFIX + popup.id;
  // session: sessionStorage so it resets on tab close
  if (popup.frequencyType === "session") {
    return !sessionStorage.getItem(key);
  }
  // once / days: localStorage
  const raw = localStorage.getItem(key);
  if (!raw) return true;
  if (popup.frequencyType === "once") return false;
  // days: compare timestamps
  const ts = Number(raw);
  if (!Number.isFinite(ts)) return true;
  const ageMs = Date.now() - ts;
  const windowMs = popup.frequencyDays * 24 * 60 * 60 * 1000;
  return ageMs >= windowMs;
}

function markSeen(popup: ActivePopup) {
  const key = STORAGE_PREFIX + popup.id;
  if (popup.frequencyType === "session") {
    sessionStorage.setItem(key, "1");
  } else {
    localStorage.setItem(key, String(Date.now()));
  }
}

function track(id: string, event: "impression" | "click" | "close") {
  // Fire and forget — never throw, never block UI
  try {
    fetch("/api/popups/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, event }),
      keepalive: true,
    });
  } catch {
    /* ignore */
  }
}

export function PopupOrchestrator({ popups, isAuthenticated }: Props) {
  const pathname = usePathname();
  const [activePopup, setActivePopup] = useState<ActivePopup | null>(null);
  const [closing, setClosing] = useState(false);
  const armed = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (popups.length === 0) return;

    const pageType = pageTypeForPath(pathname);

    // Pick the first popup that matches current context and is allowed.
    const candidate = popups.find((p) => {
      // Page targeting
      if (p.pageTarget !== "all" && p.pageTarget !== pageType) return false;
      // Audience targeting
      if (p.audience === "guest" && isAuthenticated) return false;
      if (p.audience === "registered" && !isAuthenticated) return false;
      // Frequency
      if (!isFreshFor(p)) return false;
      // Not already armed during this mount (re-armed per route)
      if (armed.current.has(p.id)) return false;
      return true;
    });

    if (!candidate) return;
    armed.current.add(candidate.id);

    let cleanup = () => {};

    const fire = () => {
      setActivePopup(candidate);
      markSeen(candidate);
      track(candidate.id, "impression");
    };

    if (candidate.triggerType === "delay") {
      const ms = Math.max(0, candidate.triggerValue) * 1000;
      const t = window.setTimeout(fire, ms);
      cleanup = () => window.clearTimeout(t);
    } else if (candidate.triggerType === "exit_intent") {
      const handler = (e: MouseEvent) => {
        // mouseout to outside the viewport (clientY < ~5 = leaving toward URL bar)
        if (e.clientY <= 5 && !e.relatedTarget) {
          fire();
          document.removeEventListener("mouseout", handler);
        }
      };
      document.addEventListener("mouseout", handler);
      cleanup = () => document.removeEventListener("mouseout", handler);
    } else if (candidate.triggerType === "scroll") {
      const threshold = Math.min(100, Math.max(1, candidate.triggerValue));
      const handler = () => {
        const doc = document.documentElement;
        const scrolled = doc.scrollTop / Math.max(1, doc.scrollHeight - doc.clientHeight);
        if (scrolled * 100 >= threshold) {
          fire();
          window.removeEventListener("scroll", handler);
        }
      };
      window.addEventListener("scroll", handler, { passive: true });
      cleanup = () => window.removeEventListener("scroll", handler);
    }

    return cleanup;
  }, [popups, pathname, isAuthenticated]);

  // ESC to close
  useEffect(() => {
    if (!activePopup) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePopup]);

  function handleClose() {
    if (!activePopup) return;
    track(activePopup.id, "close");
    setClosing(true);
    window.setTimeout(() => {
      setActivePopup(null);
      setClosing(false);
    }, 180);
  }

  function handleCta() {
    if (!activePopup) return;
    track(activePopup.id, "click");
    // Navigation happens via the Link href; we just record the click.
  }

  if (!activePopup) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] grid place-items-center px-4 transition-opacity duration-150 ${
        closing ? "opacity-0" : "opacity-100"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="סגור פופאפ"
        onClick={handleClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      {/* Popup */}
      <div
        className={`relative bg-white shadow-2xl max-w-md w-full overflow-hidden text-brand-text transition-transform duration-200 ${
          closing ? "scale-95" : "scale-100"
        }`}
        dir="rtl"
      >
        {activePopup.imageUrl && (
          <div className="relative aspect-[16/9] bg-brand-bg-soft">
            <Image
              src={activePopup.imageUrl}
              alt=""
              fill
              sizes="448px"
              className="object-cover"
              unoptimized={
                activePopup.imageUrl.startsWith("http") &&
                !activePopup.imageUrl.includes("vercel-storage.com")
              }
              priority
            />
          </div>
        )}

        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3 left-3 size-9 grid place-items-center rounded-full bg-white/95 text-brand-text-soft hover:text-brand-primary shadow z-10"
          aria-label="סגור"
        >
          <X className="size-4" />
        </button>

        <div className="p-6 text-center">
          <h2
            id="popup-title"
            className="font-display text-2xl text-brand-primary mb-3"
          >
            {activePopup.title}
          </h2>
          <p className="text-sm leading-relaxed text-brand-text whitespace-pre-line mb-5">
            {activePopup.body}
          </p>

          {activePopup.couponCode && <CouponBlock code={activePopup.couponCode} />}

          {activePopup.ctaText && (
            <Link
              href={activePopup.ctaUrl || "#"}
              onClick={handleCta}
              className="inline-block w-full px-8 py-3.5 bg-brand-primary text-white text-[0.78rem] tracking-[0.2em] uppercase font-medium hover:bg-brand-primary-soft transition-colors no-underline"
            >
              {activePopup.ctaText}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function CouponBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="mb-5 inline-flex items-center gap-2 px-4 py-2 bg-brand-bg-soft border-2 border-dashed border-brand-accent/60 hover:border-brand-accent transition-colors rounded"
    >
      <Tag className="size-3.5 text-brand-accent-dark" />
      <code className="font-mono text-sm font-semibold text-brand-accent-dark">
        {code}
      </code>
      {copied ? (
        <Check className="size-3.5 text-emerald-600" />
      ) : (
        <Copy className="size-3 text-brand-text-soft" />
      )}
    </button>
  );
}
