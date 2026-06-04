"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import type { Prisma } from "@prisma/client";
import type { ProductFormState } from "@/lib/admin/products-actions";
import { cn } from "@/lib/utils";
import { hebrewToSlug } from "@/lib/hebrew-slug";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { MultiImageField } from "@/components/admin/multi-image-field";
import { AiDescriptionTextarea } from "@/components/admin/ai-description-textarea";

type ProductWithCategory = Prisma.ProductGetPayload<{ include: { category: true } }>;

export type CategoryTreeForPicker = Array<{
  id: string;
  name: string;
  children: Array<{ id: string; name: string }>;
}>;

type Props = {
  categories: CategoryTreeForPicker;
  product?: ProductWithCategory | null;
  action: (state: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  submitLabel?: string;
  /** Pulled from /admin/settings — drives the SKU section. */
  settings: {
    skuEnabled: boolean;
  };
};

const initialState: ProductFormState = { ok: false };

export function ProductForm({
  categories,
  product,
  action,
  submitLabel = "שמור",
  settings,
}: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);

  const initialImages = (product?.images as string[] | null) ?? [];

  const [mainImage, setMainImage] = useState(product?.image ?? "");
  const [images, setImages] = useState<string[]>(initialImages);

  // Auto-derived from the Hebrew name. The user never sees these
  // fields — they're submitted as hidden inputs. For existing products
  // we keep the saved slug so URLs don't break after a rename.
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");

  // SKU rendering rule:
  //   global setting ON  → SKU input is always shown on every product
  //                        (no per-product opt-in needed).
  //   global setting OFF → SKU is hidden by default. Each product gets a
  //                        small "+ הוסף מק״ט למוצר זה" button that
  //                        reveals the input for that single product.
  // For an existing product that already has a SKU when the global
  // setting is OFF, we start opted-in so the field stays visible.
  const [optedIn, setOptedIn] = useState(Boolean(product?.sku));
  const [sku, setSku] = useState(product?.sku ?? "");
  const showSkuInput = settings.skuEnabled || optedIn;

  // Category picker — same 2-level pattern as before
  const initialIds = useMemo(() => {
    const saved = product?.categoryId ?? "";
    for (const top of categories) {
      const child = top.children.find((c) => c.id === saved);
      if (child) return { topLevelId: top.id, subcategoryId: child.id };
    }
    return { topLevelId: saved, subcategoryId: "" };
  }, [categories, product?.categoryId]);
  const [topLevelId, setTopLevelId] = useState(initialIds.topLevelId);
  const [subcategoryId, setSubcategoryId] = useState(initialIds.subcategoryId);

  const selectedTopLevel = categories.find((c) => c.id === topLevelId);
  const subOptions = selectedTopLevel?.children ?? [];
  const effectiveCategoryId = subcategoryId || topLevelId;

  function handleNameChange(value: string) {
    setName(value);
    // Auto-fill slug from Hebrew transliteration UNLESS this is an
    // existing product (slug change would break links). New product:
    // overwrite freely as the user types.
    if (!product) {
      setSlug(hebrewToSlug(value));
    }
  }

  return (
    <form action={formAction} className="space-y-6 max-w-[1000px]">
      {state.error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 border border-destructive/20 rounded-md">
          {state.error}
        </div>
      )}

      {/* ─── 1. IDENTITY ─── */}
      <Section title="פרטי המוצר">
        <ControlledField
          label="שם המוצר"
          name="name"
          value={name}
          onChange={handleNameChange}
          required
          error={state.fieldErrors?.name}
          help={
            product
              ? "כפי שיוצג ללקוחות באתר"
              : "כפי שיוצג ללקוחות. נכתוב לך אוטומטית את הכתובת באנגלית מהשם."
          }
        />
        {/* Hidden fields the server still needs — auto-derived from name */}
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="nameEn" value={name} />

        {/* Category on the right (start in RTL). When SKU is globally
            enabled, the input sits on the left of the same row, always
            shown. Otherwise the category takes the full row and the
            per-product SKU opt-in lives in a slim slot below. */}
        <Grid className={showSkuInput ? undefined : "md:grid-cols-1"}>
          <label className="block">
            <FieldLabel required>קטגוריה</FieldLabel>
            <select
              value={topLevelId}
              onChange={(e) => {
                setTopLevelId(e.target.value);
                setSubcategoryId("");
              }}
              required
              className={cn(
                "w-full px-4 py-2.5 border bg-background focus:outline-none focus:border-foreground text-base rounded-md",
                state.fieldErrors?.categoryId ? "border-destructive" : "border-border",
              )}
            >
              <option value="">בחר קטגוריה…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {state.fieldErrors?.categoryId && (
              <FieldHelp tone="error">{state.fieldErrors.categoryId}</FieldHelp>
            )}
          </label>

          {showSkuInput && (
            <div>
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <FieldLabel>מק״ט</FieldLabel>
                {/* When global is OFF but this product opted in, give
                    a way to take the field back off again. */}
                {!settings.skuEnabled && (
                  <button
                    type="button"
                    onClick={() => {
                      setOptedIn(false);
                      setSku("");
                    }}
                    className="text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                  >
                    הסר מק״ט
                  </button>
                )}
              </div>
              <input
                name="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                dir="ltr"
                placeholder="JC-RG-001"
                className={cn(
                  "w-full px-4 py-2.5 border bg-background focus:outline-none focus:border-foreground text-base rounded-md",
                  state.fieldErrors?.sku ? "border-destructive" : "border-border",
                )}
              />
              {state.fieldErrors?.sku && (
                <FieldHelp tone="error">{state.fieldErrors.sku}</FieldHelp>
              )}
            </div>
          )}
        </Grid>

        {subOptions.length > 0 && (
          <label className="block">
            <FieldLabel>תת-קטגוריה (אופציונלי)</FieldLabel>
            <select
              value={subcategoryId}
              onChange={(e) => setSubcategoryId(e.target.value)}
              className="w-full px-4 py-2.5 border border-border bg-background focus:outline-none focus:border-foreground text-base rounded-md"
            >
              <option value="">ללא (השאר ב-{selectedTopLevel?.name})</option>
              {subOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <FieldHelp>בחירה תשייך את המוצר לתת-קטגוריה במקום לקטגוריה הראשית.</FieldHelp>
          </label>
        )}

        {/* When the global SKU setting is OFF and this product hasn't
            opted in yet, expose a small ghost button so the merchant
            can attach a SKU to this single product. */}
        {!settings.skuEnabled && !optedIn && (
          <>
            <button
              type="button"
              onClick={() => setOptedIn(true)}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 border border-dashed border-border hover:border-foreground rounded-md"
            >
              <span className="text-base leading-none">+</span>
              הוסף מק״ט למוצר זה
            </button>
            <input type="hidden" name="sku" value="" />
          </>
        )}

        <input type="hidden" name="categoryId" value={effectiveCategoryId} />
      </Section>

      {/* ─── 2. IMAGES (between identity + texts — AI description
              reads the image so it must exist before "צור עם AI") ─── */}
      <Section title="תמונות">
        <ImageUploadField
          label="תמונה ראשית"
          value={mainImage}
          onChange={setMainImage}
          name="image"
          required
          purpose={`product-${product?.id ?? "new"}`}
          aspect="square"
          help="העלאה ממכשיר או הדבקת URL. JPG/PNG/WebP, עד 8MB. אחרי ההעלאה כפתור ׳ערוך׳ פותח אדיטור (חיתוך, הסרת רקע AI, גוונים)."
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

      {/* ─── 3. TEXTS — needs an image saved first so AI description works ─── */}
      <Section title="טקסטים">
        <ControlledField
          label="תיאור קצר"
          name="meta"
          defaultValue={product?.meta ?? ""}
          help='שורה אחת מתחת לשם המוצר. למשל: חומר, גודל או מאפיין בולט'
          error={state.fieldErrors?.meta}
        />
        <AiDescriptionTextarea
          label="תיאור מלא"
          name="description"
          productId={product?.id}
          defaultValue={product?.description ?? ""}
          rows={5}
          help="מופיע בעמוד המוצר מתחת למחיר. הכפתור ✨ קורא את התמונה ויוצר תיאור אוטומטית."
          error={state.fieldErrors?.description}
        />
        <TextareaField
          label="מידע נוסף"
          name="careInstructions"
          defaultValue={product?.careInstructions ?? ""}
          rows={2}
          help="מופיע ב׳מידע נוסף׳ בעמוד המוצר. למשל: טיפול ושמירה, רכיבים, אזהרות. השאר ריק אם לא רלוונטי."
          error={state.fieldErrors?.careInstructions}
        />
      </Section>

      {/* ─── 4. PRICE + STOCK ─── */}
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
        {/* badge ("תווית") removed per merchant feedback — too rarely
            useful to be worth a field on every product. Set via DB
            import or a future bulk action if needed. We submit empty
            so the schema gets a stable value. */}
        <input type="hidden" name="badge" value="" />
      </Section>

      {/* ─── 5. DISPLAY ─── */}
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
              help="מוסתר אם לא מסומן, לקוחות לא יראו"
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
          className="inline-flex items-center px-6 py-3 border border-border text-sm font-medium hover:bg-muted transition-colors no-underline rounded-md"
        >
          ביטול
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center px-8 py-3 bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-60 rounded-md"
        >
          {pending ? "שומר…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

/* ──────────────── helpers ──────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-base font-semibold text-foreground mb-5 pb-3 border-b border-border">
        {title}
      </h3>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function Grid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  // className lets callers collapse to a single column when only one
  // child renders (e.g. SKU section hidden because it's globally off).
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-5", className)}>
      {children}
    </div>
  );
}

/** Bumped from text-xs uppercase muted → text-sm regular foreground.
 *  Much more readable, less "form fatigue". */
function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <span className="text-sm font-medium text-foreground mb-1.5 block">
      {children}
      {required && <span className="text-destructive mr-1">*</span>}
    </span>
  );
}

function FieldHelp({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "error";
}) {
  return (
    <span
      className={cn(
        "text-xs mt-1 block leading-relaxed",
        tone === "error" ? "text-destructive" : "text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
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
      <FieldLabel required={required}>{label}</FieldLabel>
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
          "w-full px-4 py-2.5 border bg-background focus:outline-none focus:border-foreground text-base rounded-md",
          error ? "border-destructive" : "border-border",
          disabled && "bg-muted text-muted-foreground",
        )}
      />
      {(error || help) && <FieldHelp tone={error ? "error" : "muted"}>{error || help}</FieldHelp>}
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
      <FieldLabel>{label}</FieldLabel>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={rows}
        className={cn(
          "w-full px-4 py-2.5 border bg-background focus:outline-none focus:border-foreground text-base resize-y leading-relaxed rounded-md",
          error ? "border-destructive" : "border-border",
        )}
      />
      {(error || help) && <FieldHelp tone={error ? "error" : "muted"}>{error || help}</FieldHelp>}
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
    <label className="flex items-start gap-2.5 cursor-pointer text-sm">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="size-4 mt-0.5 accent-foreground"
      />
      <span>
        <span className="font-medium">{label}</span>
        {help && <span className="block text-xs text-muted-foreground mt-0.5">{help}</span>}
      </span>
    </label>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  help,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  help?: string;
}) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 mt-0.5 accent-foreground"
      />
      <span>
        <span className="font-medium">{label}</span>
        {help && <span className="block text-xs text-muted-foreground mt-0.5">{help}</span>}
      </span>
    </label>
  );
}

