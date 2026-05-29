"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { X, DollarSign, Package, Eye, EyeOff, Star, FolderTree, Trash2 } from "lucide-react";
import type { Prisma } from "@prisma/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  bulkUpdatePrice,
  bulkUpdateStock,
  bulkSetActive,
  bulkSetFeatured,
  bulkMoveToCategory,
  bulkDelete,
  type BulkResult,
} from "@/lib/admin/bulk-products-actions";
import { formatPrice } from "@/lib/format";

type ProductRow = Prisma.ProductGetPayload<{ include: { category: true } }>;

type ActionKind =
  | { kind: "price" }
  | { kind: "stock" }
  | { kind: "category" }
  | { kind: "delete" };

export function BulkActionToolbar({
  selected,
  products,
  onClear,
  categories,
}: {
  selected: Set<string>;
  products: ProductRow[];
  onClear: () => void;
  categories: { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState<ActionKind | null>(null);
  const count = selected.size;
  const selectedProducts = products.filter((p) => selected.has(p.id));
  const ids = selectedProducts.map((p) => p.id);

  if (count === 0) return null;

  function runSimple(
    fn: () => Promise<BulkResult>,
    successLabel: (n: number) => string,
  ) {
    startTransition(async () => {
      const r = await fn();
      if (r.ok) {
        toast.success(successLabel(r.updatedCount));
        onClear();
      } else {
        toast.error(r.error ?? "שגיאה");
      }
    });
  }

  return (
    <>
      <div className="sticky top-0 z-30 mb-3 bg-brand-accent text-white rounded-md shadow-md px-4 py-2.5 flex items-center gap-3 flex-wrap">
        <span className="font-medium text-sm">
          {count} {count === 1 ? "מוצר נבחר" : "מוצרים נבחרו"}
        </span>

        <div className="flex items-center gap-1.5 flex-wrap ms-auto">
          <ToolbarButton
            icon={<DollarSign className="size-3.5" />}
            label="שנה מחיר"
            onClick={() => setActiveAction({ kind: "price" })}
            disabled={pending}
          />
          <ToolbarButton
            icon={<Package className="size-3.5" />}
            label="שנה מלאי"
            onClick={() => setActiveAction({ kind: "stock" })}
            disabled={pending}
          />
          <ToolbarButton
            icon={<Eye className="size-3.5" />}
            label="הצג"
            onClick={() => runSimple(() => bulkSetActive(ids, true), (n) => `${n} מוצרים הוצגו באתר`)}
            disabled={pending}
          />
          <ToolbarButton
            icon={<EyeOff className="size-3.5" />}
            label="הסתר"
            onClick={() => runSimple(() => bulkSetActive(ids, false), (n) => `${n} מוצרים הוסתרו`)}
            disabled={pending}
          />
          <ToolbarButton
            icon={<Star className="size-3.5" />}
            label="סמן כמוצג"
            onClick={() => runSimple(() => bulkSetFeatured(ids, true), (n) => `${n} מוצרים סומנו כמוצגים`)}
            disabled={pending}
          />
          <ToolbarButton
            icon={<Star className="size-3.5" />}
            label="הסר מוצגים"
            onClick={() => runSimple(() => bulkSetFeatured(ids, false), (n) => `${n} מוצרים הוסרו מהמוצגים`)}
            disabled={pending}
          />
          <ToolbarButton
            icon={<FolderTree className="size-3.5" />}
            label="העבר לקטגוריה"
            onClick={() => setActiveAction({ kind: "category" })}
            disabled={pending}
          />
          <ToolbarButton
            icon={<Trash2 className="size-3.5" />}
            label="מחק"
            variant="danger"
            onClick={() => setActiveAction({ kind: "delete" })}
            disabled={pending}
          />
          <button
            onClick={onClear}
            disabled={pending}
            className="ms-2 inline-flex items-center justify-center size-7 rounded-md hover:bg-white/15 transition-colors"
            title="בטל בחירה"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {activeAction?.kind === "price" && (
        <PriceModal
          products={selectedProducts}
          onClose={() => setActiveAction(null)}
          onDone={() => {
            setActiveAction(null);
            onClear();
          }}
        />
      )}
      {activeAction?.kind === "stock" && (
        <StockModal
          products={selectedProducts}
          onClose={() => setActiveAction(null)}
          onDone={() => {
            setActiveAction(null);
            onClear();
          }}
        />
      )}
      {activeAction?.kind === "category" && (
        <CategoryModal
          products={selectedProducts}
          categories={categories}
          onClose={() => setActiveAction(null)}
          onDone={() => {
            setActiveAction(null);
            onClear();
          }}
        />
      )}
      <AlertDialog
        open={activeAction?.kind === "delete"}
        onOpenChange={(o) => !o && setActiveAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקה גורפת</AlertDialogTitle>
            <AlertDialogDescription>
              למחוק <strong>{count}</strong> מוצרים? פעולה זו לא ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                runSimple(() => bulkDelete(ids), (n) => `${n} מוצרים נמחקו`)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {pending ? "מוחק…" : `מחק ${count}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ToolbarButton({
  icon,
  label,
  onClick,
  disabled,
  variant = "default",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "danger";
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        "inline-flex items-center gap-1.5 text-[0.78rem] font-medium px-2.5 py-1.5 rounded-md transition-colors disabled:opacity-50 " +
        (variant === "danger"
          ? "bg-white/10 hover:bg-white/20 text-white"
          : "bg-white/15 hover:bg-white/25 text-white")
      }
    >
      {icon}
      {label}
    </button>
  );
}

/* ────────────────────── PRICE MODAL ────────────────────── */

type PriceMode = "set" | "increase-pct" | "decrease-pct" | "set-original";

function PriceModal({
  products,
  onClose,
  onDone,
}: {
  products: ProductRow[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<PriceMode>("decrease-pct");
  const [value, setValue] = useState("20");
  const [pending, startTransition] = useTransition();
  const numValue = Number(value);
  const valid =
    !Number.isNaN(numValue) &&
    numValue >= 0 &&
    (mode === "decrease-pct" ? numValue <= 99 : true);

  function previewNewPrice(currentPrice: number): number | null {
    if (!valid) return null;
    if (mode === "set") return Math.round(numValue);
    if (mode === "set-original") return Math.round(numValue);
    const factor = mode === "increase-pct" ? 1 + numValue / 100 : 1 - numValue / 100;
    return Math.round(currentPrice * factor);
  }

  function submit() {
    if (!valid) return;
    startTransition(async () => {
      const ids = products.map((p) => p.id);
      const op =
        mode === "set"
          ? ({ mode: "set", value: Math.round(numValue) } as const)
          : mode === "set-original"
            ? ({ mode: "set-original", value: Math.round(numValue) } as const)
            : ({ mode, value: numValue } as const);
      const r = await bulkUpdatePrice(ids, op);
      if (r.ok) {
        toast.success(`מחירי ${r.updatedCount} מוצרים עודכנו`);
        onDone();
      } else {
        toast.error(r.error ?? "שגיאה בעדכון");
      }
    });
  }

  return (
    <ModalShell
      title={`עריכת מחירים — ${products.length} מוצרים נבחרו`}
      onClose={onClose}
    >
      <fieldset className="space-y-2.5 mb-4">
        <RadioOption
          checked={mode === "decrease-pct"}
          onChange={() => setMode("decrease-pct")}
          label="הקטן ב..."
          suffix="%"
        />
        <RadioOption
          checked={mode === "increase-pct"}
          onChange={() => setMode("increase-pct")}
          label="הגדל ב..."
          suffix="%"
        />
        <RadioOption
          checked={mode === "set"}
          onChange={() => setMode("set")}
          label="קבע מחיר ל..."
          suffix="₪"
        />
        <RadioOption
          checked={mode === "set-original"}
          onChange={() => setMode("set-original")}
          label='קבע מחיר מקור (לתצוגת מבצע) ל...'
          suffix="₪"
        />
      </fieldset>

      <label className="block mb-4">
        <span className="text-[0.78rem] tracking-[0.1em] uppercase text-muted-foreground mb-1.5 block">
          ערך
        </span>
        <input
          type="number"
          step={mode.includes("pct") ? "0.5" : "1"}
          min={0}
          max={mode === "decrease-pct" ? 99 : undefined}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          dir="ltr"
          className="w-full px-4 py-2.5 border border-border bg-background focus:outline-none focus:border-foreground text-base rounded-md tabular-nums"
        />
      </label>

      <PreviewList
        items={products.slice(0, 5).map((p) => ({
          name: p.name,
          before: formatPrice(p.price),
          after:
            previewNewPrice(p.price) != null
              ? formatPrice(previewNewPrice(p.price)!)
              : "—",
        }))}
        moreCount={Math.max(0, products.length - 5)}
      />

      <ModalActions
        onCancel={onClose}
        onConfirm={submit}
        disabled={!valid || pending}
        confirmLabel={pending ? "מעדכן…" : `אישור — ${products.length} שינויים`}
      />
    </ModalShell>
  );
}

/* ────────────────────── STOCK MODAL ────────────────────── */

type StockMode = "set" | "increase" | "decrease";

function StockModal({
  products,
  onClose,
  onDone,
}: {
  products: ProductRow[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<StockMode>("set");
  const [value, setValue] = useState("0");
  const [pending, startTransition] = useTransition();
  const numValue = Math.round(Number(value));
  const valid = !Number.isNaN(numValue) && numValue >= (mode === "set" ? 0 : 1);

  function previewNewStock(current: number): number | null {
    if (!valid) return null;
    if (mode === "set") return numValue;
    if (mode === "increase") return current + numValue;
    return Math.max(0, current - numValue);
  }

  function submit() {
    if (!valid) return;
    startTransition(async () => {
      const ids = products.map((p) => p.id);
      const r = await bulkUpdateStock(ids, { mode, value: numValue });
      if (r.ok) {
        toast.success(`מלאי של ${r.updatedCount} מוצרים עודכן`);
        onDone();
      } else {
        toast.error(r.error ?? "שגיאה בעדכון");
      }
    });
  }

  return (
    <ModalShell
      title={`עדכון מלאי — ${products.length} מוצרים נבחרו`}
      onClose={onClose}
    >
      <fieldset className="space-y-2.5 mb-4">
        <RadioOption
          checked={mode === "set"}
          onChange={() => setMode("set")}
          label="קבע מלאי ל..."
        />
        <RadioOption
          checked={mode === "increase"}
          onChange={() => setMode("increase")}
          label="הוסף..."
        />
        <RadioOption
          checked={mode === "decrease"}
          onChange={() => setMode("decrease")}
          label="הקטן ב..."
        />
      </fieldset>

      <label className="block mb-4">
        <span className="text-[0.78rem] tracking-[0.1em] uppercase text-muted-foreground mb-1.5 block">
          כמות
        </span>
        <input
          type="number"
          step="1"
          min={mode === "set" ? 0 : 1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          dir="ltr"
          className="w-full px-4 py-2.5 border border-border bg-background focus:outline-none focus:border-foreground text-base rounded-md tabular-nums"
        />
      </label>

      <PreviewList
        items={products.slice(0, 5).map((p) => ({
          name: p.name,
          before: String(p.stock),
          after: previewNewStock(p.stock) != null ? String(previewNewStock(p.stock)) : "—",
        }))}
        moreCount={Math.max(0, products.length - 5)}
      />

      <ModalActions
        onCancel={onClose}
        onConfirm={submit}
        disabled={!valid || pending}
        confirmLabel={pending ? "מעדכן…" : `אישור — ${products.length} שינויים`}
      />
    </ModalShell>
  );
}

/* ────────────────────── CATEGORY MODAL ────────────────────── */

function CategoryModal({
  products,
  categories,
  onClose,
  onDone,
}: {
  products: ProductRow[];
  categories: { id: string; name: string }[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [categoryId, setCategoryId] = useState("");
  const [pending, startTransition] = useTransition();
  const target = categories.find((c) => c.id === categoryId);

  function submit() {
    if (!categoryId) return;
    startTransition(async () => {
      const ids = products.map((p) => p.id);
      const r = await bulkMoveToCategory(ids, categoryId);
      if (r.ok) {
        toast.success(`${r.updatedCount} מוצרים הועברו ל-${target?.name ?? "קטגוריה החדשה"}`);
        onDone();
      } else {
        toast.error(r.error ?? "שגיאה בהעברה");
      }
    });
  }

  return (
    <ModalShell
      title={`העברה לקטגוריה — ${products.length} מוצרים`}
      onClose={onClose}
    >
      <label className="block mb-4">
        <span className="text-[0.78rem] tracking-[0.1em] uppercase text-muted-foreground mb-1.5 block">
          קטגוריית יעד
        </span>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          autoFocus
          className="w-full px-4 py-2.5 border border-border bg-background focus:outline-none focus:border-foreground text-sm rounded-md"
        >
          <option value="">בחרו קטגוריה...</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      {target && (
        <PreviewList
          items={products.slice(0, 5).map((p) => ({
            name: p.name,
            before: p.category.name,
            after: target.name,
          }))}
          moreCount={Math.max(0, products.length - 5)}
        />
      )}

      <ModalActions
        onCancel={onClose}
        onConfirm={submit}
        disabled={!categoryId || pending}
        confirmLabel={pending ? "מעביר…" : `אישור — ${products.length} מוצרים`}
      />
    </ModalShell>
  );
}

/* ────────────────────── shared bits ────────────────────── */

function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm grid place-items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-lg shadow-xl w-full max-w-[480px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="size-7 grid place-items-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="סגור"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function RadioOption({
  checked,
  onChange,
  label,
  suffix,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  suffix?: string;
}) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer w-full">
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="size-4 accent-brand-accent"
      />
      <span className="text-sm text-foreground flex-1">{label}</span>
      {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
    </label>
  );
}

function PreviewList({
  items,
  moreCount,
}: {
  items: { name: string; before: string; after: string }[];
  moreCount: number;
}) {
  return (
    <div className="bg-muted/40 border border-border rounded-md p-3 mb-5">
      <div className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground mb-2">
        תצוגה מקדימה
      </div>
      <div className="space-y-1.5 text-[0.82rem]">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="flex-1 truncate text-foreground">{it.name}</span>
            <span className="text-muted-foreground tabular-nums">{it.before}</span>
            <span className="text-muted-foreground">→</span>
            <span className="text-brand-accent font-medium tabular-nums">{it.after}</span>
          </div>
        ))}
        {moreCount > 0 && (
          <div className="text-[11px] text-muted-foreground pt-1.5 border-t border-border/60">
            ועוד {moreCount} מוצרים נוספים…
          </div>
        )}
      </div>
    </div>
  );
}

function ModalActions({
  onCancel,
  onConfirm,
  disabled,
  confirmLabel,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  disabled?: boolean;
  confirmLabel: string;
}) {
  return (
    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
      <button
        onClick={onCancel}
        className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ביטול
      </button>
      <button
        onClick={onConfirm}
        disabled={disabled}
        className="px-5 py-2 bg-brand-accent text-white text-sm font-medium rounded-md hover:bg-brand-accent-dark transition-colors disabled:opacity-50"
      >
        {confirmLabel}
      </button>
    </div>
  );
}
