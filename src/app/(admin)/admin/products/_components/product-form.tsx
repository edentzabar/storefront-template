"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { Prisma, Category } from "@prisma/client";
import type { ProductFormState } from "@/lib/admin/products-actions";
import { cn } from "@/lib/utils";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { MultiImageField } from "@/components/admin/multi-image-field";

type ProductWithCategory = Prisma.ProductGetPayload<{ include: { category: true } }>;

type Props = {
  categories: Category[];
  product?: ProductWithCategory | null;
  action: (state: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  submitLabel?: string;
};

const initialState: ProductFormState = { ok: false };

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ProductForm({ categories, product, action, submitLabel = "שמור" }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);

  const initialImages = (product?.images as string[] | null) ?? [];
  const sizes = (product?.sizes as string[] | null) ?? [];
  const specs = (product?.specs as Record<string, string> | null) ?? {};

  const [mainImage, setMainImage] = useState(product?.image ?? "");
  const [images, setImages] = useState<string[]>(initialImages);
  const [nameEn, setNameEn] = useState(product?.nameEn ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(Boolean(product));

  function handleNameEnChange(value: string) {
    setNameEn(value);
    if (!slugManuallyEdited) setSlug(slugify(value));
  }

  function handleSlugChange(value: string) {
    setSlug(value);
    if (value === "") {
      setSlugManuallyEdited(false);
      setSlug(slugify(nameEn));
    } else {
      setSlugManuallyEdited(true);
    }
  }

  return (
    <form action={formAction} className="space-y-6 max-w-[1000px]">
      {state.error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 border border-destructive/20 rounded-md">
          {state.error}
        </div>
      )}

      <Section title="זיהוי">
        <Grid>
          <ControlledField
            label="שם המוצר"
            name="name"
            defaultValue={product?.name ?? ""}
            required
            error={state.fieldErrors?.name}
            help="כפי שיוצג ללקוחות באתר"
          />
          <ControlledField
            label="שם באנגלית"
            name="nameEn"
            value={nameEn}
            onChange={handleNameEnChange}
            error={state.fieldErrors?.nameEn}
            help="משמש לחיפוש ול-SEO. גם בסיס ליצירת ה-URL (slug) אוטומטית."
          />
        </Grid>
        <Grid>
          <ControlledField
            label="Slug (כתובת ב-URL)"
            name="slug"
            value={slug}
            onChange={handleSlugChange}
            required
            error={state.fieldErrors?.slug}
            help={
              slugManuallyEdited
                ? `המוצר יהיה זמין ב-/product/${slug || "..."} · נקה לחזרה לאוטומטי`
                : `מתעדכן אוטומטית מהשם באנגלית. URL: /product/${slug || "..."}`
            }
            dir="ltr"
          />
          <SelectField
            label="קטגוריה"
            name="categoryId"
            required
            defaultValue={product?.categoryId}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            error={state.fieldErrors?.categoryId}
          />
        </Grid>
        <Grid>
          <ControlledField
            label='מק"ט (SKU)'
            name="sku"
            defaultValue={product?.sku ?? ""}
            required
            error={state.fieldErrors?.sku}
            help='מק"ט פנימי לזיהוי המוצר. למשל JC-RG-001'
            dir="ltr"
          />
        </Grid>
      </Section>

      <Section title="טקסטים">
        <ControlledField
          label="תיאור קצר (תת-כותרת)"
          name="meta"
          defaultValue={product?.meta ?? ""}
          help='שורה אחת מתחת לשם המוצר — למשל: חומר, גודל או מאפיין בולט'
          error={state.fieldErrors?.meta}
        />
        <TextareaField
          label="תיאור מלא"
          name="description"
          defaultValue={product?.description ?? ""}
          rows={5}
          help="מופיע בעמוד המוצר מתחת למחיר"
          error={state.fieldErrors?.description}
        />
        <TextareaField
          label="טיפול ושמירה"
          name="careInstructions"
          defaultValue={product?.careInstructions ?? ""}
          rows={2}
          help={`מופיע ב'מידע נוסף' בעמוד המוצר. השאר ריק אם לא רלוונטי.`}
          error={state.fieldErrors?.careInstructions}
        />
      </Section>

      <Section title="מחיר ומלאי">
        <Grid>
          <ControlledField
            label="מחיר (₪)"
            name="price"
            type="number"
            min={0}
            defaultValue={product?.price?.toString() ?? ""}
            required
            error={state.fieldErrors?.price}
            help="בשקלים, ללא ספרות עשרוניות"
          />
          <ControlledField
            label="מחיר לפני מבצע (₪)"
            name="originalPrice"
            type="number"
            min={0}
            defaultValue={product?.originalPrice?.toString() ?? ""}
            help="לסימון הנחה. השאר ריק אם אין מבצע."
            error={state.fieldErrors?.originalPrice}
          />
          <ControlledField
            label="מלאי"
            name="stock"
            type="number"
            min={0}
            defaultValue={product?.stock?.toString() ?? "0"}
            help="כשמגיע ל-0 המוצר מסומן כאזל"
            error={state.fieldErrors?.stock}
          />
        </Grid>
        <Grid>
          <ControlledField
            label="תווית (badge)"
            name="badge"
            defaultValue={product?.badge ?? ""}
            help='טקסט קצר על תמונת המוצר — "חדש", "מבצע", "נמכר"'
            error={state.fieldErrors?.badge}
          />
          <SelectField
            label="צבע התווית"
            name="badgeType"
            defaultValue={product?.badgeType ?? ""}
            options={[
              { value: "", label: "ללא" },
              { value: "new", label: "חדש (כהה)" },
              { value: "sale", label: "מבצע (זהב)" },
            ]}
          />
        </Grid>
      </Section>

      <Section title="תמונות">
        <ImageUploadField
          label="תמונה ראשית *"
          value={mainImage}
          onChange={setMainImage}
          name="image"
          required
          purpose={`product-${product?.id ?? "new"}`}
          aspect="square"
          help="העלאה ממכשיר או הדבקת URL. JPG/PNG/WebP — עד 8MB."
        />
        <MultiImageField
          label="תמונות נוספות לגלריה"
          value={images}
          onChange={setImages}
          name="imagesText"
          purpose={`product-${product?.id ?? "new"}-gallery`}
          help="בחירה מרובה. גרור לסידור מחדש. הראשונה תוצג בכרטיס המוצר."
        />
      </Section>

      <Section title="מפרט ומידות">
        <TextareaField
          label="מפרט טכני"
          name="specsText"
          defaultValue={Object.entries(specs)
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n")}
          rows={5}
          help='שורה לכל פריט בפורמט "מפתח: ערך" — למשל: חומר: כותנה'
        />
        <ControlledField
          label="מידות זמינות"
          name="sizesText"
          defaultValue={sizes.join(", ")}
          help="מופרדות בפסיק. השאר ריק אם המוצר לא דורש מידה — למשל שרשרת"
        />
      </Section>

      <Section title="הצגה">
        <Grid>
          <ControlledField
            label="סדר תצוגה"
            name="sortOrder"
            type="number"
            defaultValue={product?.sortOrder?.toString() ?? "0"}
            help="קטן יותר = מופיע ראשון בתוצאות הקטגוריה ובדף הבית"
          />
          <div className="flex flex-col gap-3 pt-4">
            <CheckboxField
              label="פעיל באתר"
              name="isActive"
              defaultChecked={product?.isActive ?? true}
              help="מוסתר אם לא מסומן — לקוחות לא יראו"
            />
            <CheckboxField
              label="מוצג בדף הבית"
              name="isFeatured"
              defaultChecked={product?.isFeatured ?? false}
              help="עולה בסקציית 'המוצרים הנבחרים'"
            />
          </div>
        </Grid>
      </Section>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Link
          href="/admin/products"
          className="inline-flex items-center px-6 py-3 border border-border text-[0.78rem] tracking-[0.15em] uppercase font-medium hover:bg-muted transition-colors no-underline rounded-md"
        >
          ביטול
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center px-8 py-3 bg-foreground text-background text-[0.78rem] tracking-[0.15em] uppercase font-medium hover:bg-foreground/90 transition-colors disabled:opacity-60 rounded-md"
        >
          {pending ? "שומר…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

// ---------- field primitives ----------

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
  min,
  dir,
}: {
  label: string;
  name: string;
  type?: string;
  value?: string;
  onChange?: (v: string) => void;
  defaultValue?: string | number;
  required?: boolean;
  disabled?: boolean;
  help?: string;
  error?: string;
  min?: number;
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
          : { defaultValue: defaultValue ?? "" })}
        required={required}
        disabled={disabled}
        min={min}
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
  error,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
  help?: string;
  error?: string;
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
        className={cn(
          "w-full px-4 py-2.5 border bg-background focus:outline-none focus:border-foreground text-sm resize-y leading-relaxed rounded-md",
          error ? "border-destructive" : "border-border",
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

function SelectField({
  label,
  name,
  defaultValue,
  options,
  required,
  error,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  options: { value: string; label: string }[];
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="text-[0.78rem] tracking-[0.1em] uppercase text-muted-foreground mb-1.5 block">
        {label}
        {required && <span className="text-destructive mr-1">*</span>}
      </span>
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        className={cn(
          "w-full px-4 py-2.5 border bg-background focus:outline-none focus:border-foreground text-sm rounded-md",
          error ? "border-destructive" : "border-border",
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="text-[11px] text-destructive mt-1 block">{error}</span>
      )}
    </label>
  );
}

function CheckboxField({
  label,
  name,
  defaultChecked,
  help,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
  help?: string;
}) {
  return (
    <label className="inline-flex items-start gap-2.5 cursor-pointer">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="w-4 h-4 mt-1 accent-brand-primary shrink-0"
      />
      <span>
        <span className="text-sm text-foreground block">{label}</span>
        {help && (
          <span className="text-[11px] text-muted-foreground block mt-0.5">
            {help}
          </span>
        )}
      </span>
    </label>
  );
}
