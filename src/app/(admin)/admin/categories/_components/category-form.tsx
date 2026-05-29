"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { Plus, X, GripVertical } from "lucide-react";
import type { Category } from "@prisma/client";
import type { CategoryFormState } from "@/lib/admin/categories-actions";
import { cn } from "@/lib/utils";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/** A subcategory row in the inline children editor. */
type ChildDraft = {
  /** Stable client-side key for DnD (independent of DB id, so new rows
   *  also drag cleanly before they're saved) */
  _key: string;
  /** undefined for a brand-new row, set for an existing child loaded from the DB */
  id?: string;
  name: string;
  nameEn: string;
  slug: string;
  /** true if the user manually edited the slug — otherwise it tracks nameEn */
  slugManuallyEdited: boolean;
};

let _keyCounter = 0;
function nextKey() {
  _keyCounter += 1;
  return `child-${_keyCounter}-${Date.now()}`;
}

type Props = {
  category?: Category | null;
  /** All top-level categories the user can pick from as a parent (excludes self). */
  parents: Array<{ id: string; name: string }>;
  /** Existing children of this category (empty for new ones). */
  existingChildren?: Array<{ id: string; name: string; nameEn: string; slug: string }>;
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

export function CategoryForm({
  category,
  parents,
  existingChildren = [],
  action,
  submitLabel = "שמור",
}: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);

  const [image, setImage] = useState(category?.image ?? "");
  const [nameEn, setNameEn] = useState(category?.nameEn ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  // Hierarchy: nested under a parent? "" / undefined means top-level.
  const [parentId, setParentId] = useState(category?.parentId ?? "");
  const isSubcategory = Boolean(parentId);

  // Inline subcategory rows — only meaningful when this category is top-level.
  // Pre-fill from DB on edit. The order in this array IS the saved order
  // (server uses array index as sortOrder).
  const [children, setChildren] = useState<ChildDraft[]>(() =>
    existingChildren.map((c) => ({
      _key: nextKey(),
      id: c.id,
      name: c.name,
      nameEn: c.nameEn,
      slug: c.slug,
      slugManuallyEdited: true, // already saved → don't auto-override
    })),
  );

  // DnD setup — pointer + keyboard for accessibility
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setChildren((rows) => {
      const oldIndex = rows.findIndex((r) => r._key === active.id);
      const newIndex = rows.findIndex((r) => r._key === over.id);
      return arrayMove(rows, oldIndex, newIndex);
    });
  }
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

  // ── Inline children helpers ──

  function addChild() {
    setChildren((rows) => [
      ...rows,
      { _key: nextKey(), name: "", nameEn: "", slug: "", slugManuallyEdited: false },
    ]);
  }
  // (Legacy index-based helpers replaced by key-based ones — see below)
  function removeChildByKey(key: string) {
    setChildren((rows) => rows.filter((r) => r._key !== key));
  }
  function updateChildByKey(key: string, patch: Partial<ChildDraft>) {
    setChildren((rows) =>
      rows.map((r) => {
        if (r._key !== key) return r;
        const next = { ...r, ...patch };
        if (patch.nameEn !== undefined && !next.slugManuallyEdited) {
          next.slug = slugify(patch.nameEn);
        }
        if (patch.slug !== undefined) {
          next.slugManuallyEdited = patch.slug !== "";
          if (patch.slug === "") next.slug = slugify(next.nameEn);
        }
        return next;
      }),
    );
  }

  // Serialize children for the server action — only valid rows (name + slug)
  const childrenPayload = useMemo(
    () =>
      JSON.stringify(
        children
          .filter((c) => c.name.trim() && c.slug.trim() && c.nameEn.trim())
          .map((c) => ({
            id: c.id,
            name: c.name.trim(),
            nameEn: c.nameEn.trim(),
            slug: c.slug.trim(),
          })),
      ),
    [children],
  );

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

      <Section title="היררכיה">
        {/* Parent selector — leave on "ללא" to make this a top-level category */}
        <label className="block">
          <span className="text-[0.78rem] tracking-[0.1em] uppercase text-muted-foreground mb-1.5 block">
            קטגוריית-אב
          </span>
          <select
            name="parentId"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="w-full px-4 py-2.5 border border-border bg-background focus:outline-none focus:border-foreground text-sm rounded-md"
          >
            <option value="">ללא — זוהי קטגוריה ראשית</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            {isSubcategory
              ? "הקטגוריה תופיע ב-dropdown מתחת לקטגוריית-האב, כשרחפים עליה."
              : "ראשית — תוכלי להוסיף לה תתי-קטגוריות בהמשך."}
          </span>
        </label>

        {/* Inline subcategories editor — only when this is a top-level category */}
        {!isSubcategory && (
          <div className="pt-5 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-medium text-foreground">תתי-קטגוריות</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  פתחי כמה שאת רוצה — יופיעו ב-dropdown מתחת לקטגוריה הזו בנאב.
                </p>
              </div>
              <button
                type="button"
                onClick={addChild}
                className="inline-flex items-center gap-1.5 text-[0.82rem] font-medium px-3 py-1.5 rounded-md bg-brand-accent text-white hover:bg-brand-accent-dark transition-colors"
              >
                <Plus className="size-3.5" />
                הוסף תת-קטגוריה
              </button>
            </div>

            {children.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-border rounded-md text-[0.85rem] text-muted-foreground">
                אין תתי-קטגוריות כרגע. לחצי "+ הוסף תת-קטגוריה" כדי לפתוח אחת.
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={children.map((c) => c._key)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="space-y-2.5 list-none">
                    {children.map((c) => (
                      <SortableChildRow
                        key={c._key}
                        child={c}
                        onChange={(patch) => updateChildByKey(c._key, patch)}
                        onRemove={() => removeChildByKey(c._key)}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            )}

            {/* Hidden — serialized for the server action */}
            <input type="hidden" name="children" value={childrenPayload} />
          </div>
        )}
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
  checked,
  onChange,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (v: boolean) => void;
}) {
  const controlled = checked !== undefined && onChange !== undefined;
  return (
    <label className="inline-flex items-center gap-2.5 cursor-pointer">
      <input
        type="checkbox"
        name={name}
        {...(controlled
          ? { checked, onChange: (e) => onChange!(e.target.checked) }
          : { defaultChecked })}
        className="w-4 h-4 accent-brand-primary"
      />
      <span className="text-sm text-foreground">{label}</span>
    </label>
  );
}

/**
 * A draggable subcategory row. Grip icon on the right (RTL = visual
 * start) is the drag handle. The form inputs themselves are NOT
 * draggable so typing in them works normally.
 */
function SortableChildRow({
  child,
  onChange,
  onRemove,
}: {
  child: ChildDraft;
  onChange: (patch: Partial<ChildDraft>) => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: child._key });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className={cn(
        "grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-2 items-end p-3 bg-muted/30 border border-border rounded-md",
        isDragging && "shadow-lg ring-2 ring-brand-accent/40 bg-card",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="size-9 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-grab active:cursor-grabbing touch-none self-end"
        title="גרור לשינוי סדר"
        aria-label="שינוי סדר"
      >
        <GripVertical className="size-4" />
      </button>
      <ChildField
        label="שם בעברית"
        value={child.name}
        onChange={(v) => onChange({ name: v })}
        required
      />
      <ChildField
        label="שם באנגלית"
        value={child.nameEn}
        onChange={(v) => onChange({ nameEn: v })}
        required
      />
      <ChildField
        label="Slug"
        value={child.slug}
        onChange={(v) => onChange({ slug: v })}
        dir="ltr"
        required
      />
      <button
        type="button"
        onClick={onRemove}
        className="size-9 grid place-items-center rounded-md text-destructive hover:bg-destructive/10 transition-colors self-end"
        title="הסר תת-קטגוריה"
      >
        <X className="size-4" />
      </button>
    </li>
  );
}

/**
 * Compact input used inside the inline subcategories editor.
 * Smaller / tighter than ControlledField — fits 3 across in a row.
 */
function ChildField({
  label,
  value,
  onChange,
  required,
  dir,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  dir?: "ltr" | "rtl";
}) {
  return (
    <label className="block">
      <span className="text-[10px] tracking-[0.12em] uppercase text-muted-foreground mb-1 block">
        {label}
        {required && <span className="text-destructive mr-1">*</span>}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        dir={dir}
        className="w-full px-2.5 py-1.5 border border-border bg-background focus:outline-none focus:border-foreground text-sm rounded-md"
      />
    </label>
  );
}
