"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { Category } from "@prisma/client";
import type { CategoryFormState } from "@/lib/admin/categories-actions";
import { cn } from "@/lib/utils";
import { ImageUploadField } from "@/components/admin/image-upload-field";

type Props = {
  category?: Category | null;
  action: (state: CategoryFormState, formData: FormData) => Promise<CategoryFormState>;
  submitLabel?: string;
};

const initialState: CategoryFormState = { ok: false };

/** Turn an English string into a URL-safe slug. */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CategoryForm({ category, action, submitLabel = "שמור" }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);

  const [image, setImage] = useState(category?.image ?? "");
  const [nameEn, setNameEn] = useState(category?.nameEn ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  // Treat existing categories as having a manually-set slug. For new ones,
  // auto-update slug from nameEn until the user types in the slug field.
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(Boolean(category));

  function handleNameEnChange(value: string) {
    setNameEn(value);
    if (!slugManuallyEdited) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlug(value);
    // If user clears the slug, resume auto-generation from nameEn.
    if (value === "") {
      setSlugManuallyEdited(false);
      setSlug(slugify(nameEn));
    } else {
      setSlugManuallyEdited(true);
    }
  }

  return (
    <form action={formAction} className="space-y-6 max-w-[800px]">
      {state.error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 border border-destructive/20">
          {state.error}
        </div>
      )}

      <Section title="זיהוי">
        <Grid>
          <ControlledField
            label="שם בעברית"
            name="name"
            defaultValue={category?.name ?? ""}
            required
            error={state.fieldErrors?.name}
            help="כפי שיוצג ללקוחות באתר"
          />
          <ControlledField
            label="שם באנגלית"
            name="nameEn"
            value={nameEn}
            onChange={handleNameEnChange}
            required
            error={state.fieldErrors?.nameEn}
            help="מופיע בכותרת דף הקטגוריה כתת-כותרת, וב-SEO. גם משמש לחיפוש."
          />
        </Grid>
        <ControlledField
          label="Slug (כתובת בURL)"
          name="slug"
          value={slug}
          onChange={handleSlugChange}
          required
          error={state.fieldErrors?.slug}
          help={
            slugManuallyEdited
              ? `הקטגוריה תהיה זמינה ב-/category/${slug || "..."} · נקה לחזרה לאוטומטי`
              : `מתעדכן אוטומטית מהשם באנגלית. הקטגוריה תהיה ב-/category/${slug || "..."}`
          }
          dir="ltr"
        />
      </Section>

      <Section title="תוכן">
        <ControlledField
          label="טקסט CTA"
          name="cta"
          defaultValue={category?.cta ?? ""}
          help='למשל: "גלו את הקולקציה"'
        />
        <TextareaField
          label="תיאור"
          name="description"
          defaultValue={category?.description ?? ""}
          rows={3}
        />
        <ImageUploadField
          label="תמונת נושא"
          value={image}
          onChange={setImage}
          name="image"
          purpose={`category-${category?.id ?? "new"}`}
          aspect="wide"
          help="התמונה תוצג בכרטיס הקטגוריה בדף הבית. מומלץ 800×1000 לפחות."
        />
      </Section>

      <Section title="SEO">
        <ControlledField
          label="כותרת SEO"
          name="seoTitle"
          defaultValue={category?.seoTitle ?? ""}
          help="ל-meta title (אם ריק — ייעשה שימוש בשם הקטגוריה)"
        />
        <TextareaField
          label="תיאור SEO"
          name="seoDescription"
          defaultValue={category?.seoDescription ?? ""}
          rows={2}
          help="ל-meta description (לתצוגה בתוצאות חיפוש)"
        />
      </Section>

      <Section title="הצגה">
        <Grid>
          <ControlledField
            label="סדר תצוגה"
            name="sortOrder"
            type="number"
            defaultValue={category?.sortOrder?.toString() ?? "0"}
            help="קטן יותר = מופיע ראשון"
          />
          <div className="flex items-end pb-2">
            <CheckboxField
              label="פעיל באתר"
              name="isActive"
              defaultChecked={category?.isActive ?? true}
            />
          </div>
        </Grid>
      </Section>

      <div className="flex justify-end gap-3 pt-4 border-t border-brand-border">
        <Link
          href="/admin/categories"
          className="inline-flex items-center px-6 py-3 border border-brand-border text-[0.78rem] tracking-[0.15em] uppercase font-medium hover:bg-brand-bg-soft transition-colors no-underline"
        >
          ביטול
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center px-8 py-3 bg-brand-primary text-white text-[0.78rem] tracking-[0.15em] uppercase font-medium hover:bg-brand-primary-soft transition-colors disabled:opacity-60"
        >
          {pending ? "שומר…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-sm font-medium text-foreground mb-5 pb-3 border-b border-border">
        {title}
      </h3>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>;
}

function ControlledField({
  label,
  name,
  type = "text",
  value,
  onChange,
  defaultValue,
  required,
  disabled,
  help,
  error,
  dir,
}: {
  label: string;
  name: string;
  type?: string;
  value?: string;
  onChange?: (v: string) => void;
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
  help?: string;
  error?: string;
  dir?: "ltr" | "rtl";
}) {
  const controlled = value !== undefined && onChange !== undefined;
  return (
    <label className="block">
      <span className="text-[0.78rem] tracking-[0.1em] uppercase text-muted-foreground mb-1.5 block">
        {label}
        {required && <span className="text-destructive mr-1">*</span>}
      </span>
      <input
        type={type}
        name={name}
        dir={dir}
        {...(controlled
          ? { value, onChange: (e) => onChange!(e.target.value) }
          : { defaultValue })}
        required={required}
        disabled={disabled}
        className={cn(
          "w-full px-4 py-2.5 border bg-background focus:outline-none focus:border-foreground text-sm rounded-md",
          error ? "border-destructive" : "border-border",
          disabled && "bg-muted text-muted-foreground",
        )}
      />
      {(error || help) && (
        <span
          className={cn(
            "text-[11px] mt-1 block",
            error ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {error || help}
        </span>
      )}
    </label>
  );
}

function TextareaField({
  label,
  name,
  defaultValue,
  rows = 3,
  help,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
  help?: string;
}) {
  return (
    <label className="block">
      <span className="text-[0.78rem] tracking-[0.1em] uppercase text-muted-foreground mb-1.5 block">
        {label}
      </span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={rows}
        className="w-full px-4 py-2.5 border border-border bg-background focus:outline-none focus:border-foreground text-sm resize-y leading-relaxed rounded-md"
      />
      {help && (
        <span className="text-[11px] text-muted-foreground mt-1 block">{help}</span>
      )}
    </label>
  );
}

function CheckboxField({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="inline-flex items-center gap-2.5 cursor-pointer">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="w-4 h-4 accent-brand-primary"
      />
      <span className="text-sm text-foreground">{label}</span>
    </label>
  );
}
