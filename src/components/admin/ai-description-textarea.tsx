"use client";

import { useState, useTransition } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { generateDescription } from "@/lib/ai/description-actions";

/**
 * Textarea + "✨ צור עם AI" button next to its label. Submits its
 * value as a normal form field (so the existing server action gets
 * `description` in FormData unchanged) but exposes an AI button that
 * fills the textarea from the product's image + name + category.
 *
 * Only the description field gets this for now; same pattern works
 * for SEO meta / SEO title — just pass `kind`.
 */
type Props = {
  label: string;
  name: string;
  productId: string | undefined;
  defaultValue: string;
  rows?: number;
  help?: string;
  error?: string;
  kind?: "describe" | "meta" | "seo-title";
};

export function AiDescriptionTextarea({
  label,
  name,
  productId,
  defaultValue,
  rows = 5,
  help,
  error,
  kind = "describe",
}: Props) {
  const [value, setValue] = useState(defaultValue);
  const [pending, startTransition] = useTransition();

  function generate() {
    if (!productId) {
      toast.error("שמור את המוצר פעם אחת לפני שתשתמש ב-AI (צריך תמונה ב-DB)");
      return;
    }
    startTransition(async () => {
      const result = await generateDescription({ productId, kind, extra: "" });
      if (result.ok) {
        // Append AI text to existing content if textarea already has
        // something — easier to merge than overwrite by accident.
        setValue((prev) => (prev.trim() ? `${prev.trim()}\n\n${result.text}` : result.text));
        toast.success(`נוצר תיאור ב-${result.provider}`);
      } else {
        toast.error(result.message || "שגיאה");
      }
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <button
          type="button"
          onClick={generate}
          disabled={pending}
          title="צור תיאור אוטומטית מתוך התמונה"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-accent hover:text-brand-accent-dark disabled:opacity-50 cursor-pointer"
        >
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          {pending ? "מייצר…" : "צור עם AI"}
        </button>
      </div>
      <textarea
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={rows}
        className="w-full px-4 py-2.5 border border-border rounded-md text-base leading-relaxed bg-background focus:outline-none focus:border-foreground resize-y"
      />
      {help && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{help}</p>}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
