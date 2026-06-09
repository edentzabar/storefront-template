"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X, Settings } from "lucide-react";
import { useCookieConsent } from "@/lib/stores/cookie-consent";

/**
 * Bottom-anchored cookie consent banner.
 *
 * Legal posture (Israeli Privacy Protection Law + 2022 court ruling):
 *   • Active consent required — visitor must click. We never assume
 *     consent from scrolling, ignoring, or closing.
 *   • Refusing is as easy as accepting — both buttons are visible at
 *     the same level, same prominence.
 *   • Granular control — "Settings" exposes per-category toggles.
 *   • Cannot be dismissed without a choice (no X to "close and ignore").
 *
 * Until the visitor accepts, optional trackers (Google Analytics,
 * Facebook Pixel, etc.) must NOT load. Gate their scripts in the
 * layout / page like:
 *   const { analytics } = useCookieConsent((s) => s.categories);
 *   if (analytics) return <GAScript />;
 */
export function CookieBanner() {
  const status = useCookieConsent((s) => s.status);
  const acceptAll = useCookieConsent((s) => s.acceptAll);
  const rejectOptional = useCookieConsent((s) => s.rejectOptional);
  const saveCustom = useCookieConsent((s) => s.saveCustom);

  const [mounted, setMounted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  // Avoid hydration mismatch — the persisted state isn't available
  // on the server, so we render nothing until the client hydrates.
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  if (status === "accepted") return null;

  return (
    <>
      {/* Bottom banner */}
      <div className="fixed inset-x-0 bottom-0 z-40 bg-white border-t-2 border-brand-primary shadow-2xl">
        <div className="max-w-[1100px] mx-auto px-6 py-5">
          <div className="flex items-start gap-3 sm:gap-4">
            <Cookie className="size-5 shrink-0 text-brand-accent mt-0.5" aria-hidden />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-brand-primary mb-1.5">
                האתר משתמש בעוגיות (Cookies)
              </h3>
              <p className="text-[13px] text-brand-text leading-relaxed">
                אנו משתמשים בעוגיות חיוניות כדי שהאתר יעבוד (התחברות, עגלת
                קניות) ובעוגיות אופציונליות לשיפור החוויה ולמדידת ביצועים.
                לחיצה על &quot;אישור הכל&quot; מהווה הסכמה לשימוש בכולן.{" "}
                <Link
                  href="/privacy"
                  className="underline text-brand-accent-dark hover:text-brand-accent"
                >
                  מדיניות פרטיות
                </Link>
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  type="button"
                  onClick={acceptAll}
                  className="px-5 py-2.5 bg-brand-primary text-white text-[0.75rem] tracking-[0.15em] uppercase font-medium hover:bg-brand-primary-soft transition-colors"
                >
                  אישור הכל
                </button>
                <button
                  type="button"
                  onClick={rejectOptional}
                  className="px-5 py-2.5 border border-brand-border text-brand-primary text-[0.75rem] tracking-[0.15em] uppercase font-medium hover:bg-brand-bg-soft transition-colors"
                >
                  רק חיוניות
                </button>
                <button
                  type="button"
                  onClick={() => setShowSettings(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 text-brand-text-soft text-[0.75rem] tracking-[0.15em] uppercase font-medium hover:text-brand-primary transition-colors"
                >
                  <Settings className="size-3.5" />
                  הגדרות
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Granular settings modal */}
      {showSettings && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4"
          onClick={() => setShowSettings(false)}
          role="dialog"
          aria-modal="true"
          aria-label="הגדרות עוגיות"
        >
          <div
            className="bg-white max-w-md w-full max-h-[85vh] overflow-y-auto border border-brand-border"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
              <h2 className="font-body text-lg font-medium text-brand-primary">
                הגדרות עוגיות
              </h2>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                aria-label="סגירה"
                className="text-brand-text-soft hover:text-brand-primary p-1"
              >
                <X className="size-5" />
              </button>
            </header>

            <div className="p-5 space-y-5">
              <CategoryRow
                title="חיוניות"
                description="עגלת קניות, התחברות, שפה, אבטחה. בלעדיהן האתר לא יכול לעבוד."
                checked={true}
                disabled
              />
              <CategoryRow
                title="ניתוח ושיפור"
                description="כלי מדידה שעוזרים לנו להבין איך משתמשים באתר ומה לשפר (למשל Google Analytics)."
                checked={analytics}
                onChange={setAnalytics}
              />
              <CategoryRow
                title="שיווק"
                description="פיקסלים של פייסבוק / גוגל לפרסום מותאם אישית באתרים אחרים."
                checked={marketing}
                onChange={setMarketing}
              />
            </div>

            <footer className="flex justify-between gap-2 px-5 py-4 border-t border-brand-border">
              <button
                type="button"
                onClick={() => {
                  rejectOptional();
                  setShowSettings(false);
                }}
                className="px-4 py-2.5 text-brand-text-soft text-[0.75rem] tracking-[0.15em] uppercase font-medium hover:text-brand-primary transition-colors"
              >
                דחה הכל
              </button>
              <button
                type="button"
                onClick={() => {
                  saveCustom({ analytics, marketing });
                  setShowSettings(false);
                }}
                className="px-5 py-2.5 bg-brand-primary text-white text-[0.75rem] tracking-[0.15em] uppercase font-medium hover:bg-brand-primary-soft transition-colors"
              >
                שמירה
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}

function CategoryRow({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (next: boolean) => void;
}) {
  return (
    <label
      className={
        disabled
          ? "flex gap-3 items-start opacity-70"
          : "flex gap-3 items-start cursor-pointer"
      }
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="size-5 mt-0.5 accent-brand-primary cursor-pointer disabled:cursor-not-allowed"
      />
      <div className="flex-1">
        <div className="text-sm font-medium text-brand-primary">
          {title}
          {disabled && (
            <span className="text-[10px] text-brand-text-soft me-2">
              (תמיד פעיל)
            </span>
          )}
        </div>
        <p className="text-[12px] text-brand-text-soft leading-relaxed mt-1">
          {description}
        </p>
      </div>
    </label>
  );
}
