"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/lib/admin/upload-actions";

/**
 * Upload-or-paste image field. Accepts an external URL via the inline text
 * input, OR uploads a file to Vercel Blob and stores the returned URL.
 */
export function ImageUploadField({
  label,
  value,
  onChange,
  purpose,
  help,
  aspect = "wide",
  name,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  purpose: string;
  help?: string;
  /** Preview aspect — "wide" = 16:9, "square" = 1:1, "tall" = 3:4 */
  aspect?: "wide" | "square" | "tall";
  /** Optional hidden input name — for native form submission */
  name?: string;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState(value);

  function handleFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("purpose", purpose);
    startTransition(async () => {
      const result = await uploadImage(formData);
      if (result.ok && result.url) {
        setText(result.url);
        onChange(result.url);
        toast.success("התמונה הועלתה");
      } else {
        toast.error(result.error ?? "שגיאה בהעלאה");
      }
    });
  }

  const aspectClass =
    aspect === "square" ? "aspect-square" : aspect === "tall" ? "aspect-[3/4]" : "aspect-video";

  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
        {label}
      </div>
      <div className="flex gap-3 items-start">
        {/* Preview */}
        <div
          className={`relative ${aspectClass} w-40 shrink-0 overflow-hidden rounded-md border border-border bg-muted/40`}
        >
          {text ? (
            <Image
              src={text}
              alt=""
              fill
              sizes="160px"
              className="object-cover"
              unoptimized={text.startsWith("http") && !text.includes("vercel-storage.com")}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-[10px] text-muted-foreground">
              אין תמונה
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <input
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              onChange(e.target.value);
            }}
            placeholder="https://..."
            className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background font-mono"
            dir="ltr"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={pending}
              className="gap-1.5"
            >
              {pending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Upload className="size-3.5" />
              )}
              {pending ? "מעלה..." : "העלאה"}
            </Button>
            {text && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setText("");
                  onChange("");
                }}
                className="gap-1.5 text-muted-foreground"
              >
                <X className="size-3.5" />
                נקה
              </Button>
            )}
          </div>
          {help && (
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {help}
            </p>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
        </div>
      </div>
      {name && (
        <input
          type="hidden"
          name={name}
          value={text}
          required={required}
        />
      )}
    </div>
  );
}
