"use client";

import Image from "next/image";
import { X, Tag } from "lucide-react";

/**
 * Visual preview of a popup, matching the storefront component styling.
 * Pure presentation — no triggers, no tracking.
 */
export function PopupPreview({
  title,
  body,
  imageUrl,
  ctaText,
  ctaUrl,
  couponCode,
}: {
  title: string;
  body: string;
  imageUrl?: string | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
  couponCode?: string | null;
}) {
  return (
    <div className="relative bg-white border border-brand-border shadow-xl max-w-md mx-auto overflow-hidden text-brand-text" dir="rtl">
      {imageUrl && (
        <div className="relative aspect-[16/9] bg-brand-bg-soft">
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="448px"
            className="object-cover"
            unoptimized={imageUrl.startsWith("http") && !imageUrl.includes("vercel-storage.com")}
          />
        </div>
      )}

      <button
        type="button"
        className="absolute top-3 left-3 size-8 grid place-items-center rounded-full bg-white/95 text-brand-text-soft hover:text-brand-primary shadow"
        aria-label="סגור"
        disabled
      >
        <X className="size-4" />
      </button>

      <div className="p-6 text-center">
        <h2 className="font-display text-2xl text-brand-primary mb-3">
          {title || "כותרת הפופאפ"}
        </h2>
        <p className="text-sm leading-relaxed text-brand-text whitespace-pre-line mb-5">
          {body || "כאן יופיע טקסט הגוף של הפופאפ. הוא יכול להיות באורך של כמה שורות."}
        </p>

        {couponCode && (
          <div className="mb-5 inline-flex items-center gap-2 px-3 py-2 bg-brand-bg-soft border-2 border-dashed border-brand-accent/60 rounded">
            <Tag className="size-3.5 text-brand-accent-dark" />
            <code className="font-mono text-sm font-semibold text-brand-accent-dark">
              {couponCode}
            </code>
          </div>
        )}

        {ctaText && (
          <a
            href={ctaUrl || "#"}
            className="inline-block w-full px-8 py-3.5 bg-brand-primary text-white text-[0.78rem] tracking-[0.2em] uppercase font-medium hover:bg-brand-primary-soft transition-colors no-underline"
            onClick={(e) => e.preventDefault()}
          >
            {ctaText}
          </a>
        )}
      </div>
    </div>
  );
}
