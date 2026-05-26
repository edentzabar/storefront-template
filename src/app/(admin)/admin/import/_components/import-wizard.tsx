"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Papa from "papaparse";
import type { Category } from "@prisma/client";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Upload,
  AlertTriangle,
  ShoppingBag,
  Download,
  Info,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { importProductBatch, finalizeImport } from "@/lib/admin/import/actions";
import { parseImportRows } from "@/lib/admin/import";
import { IMPORT_BATCH_SIZE } from "@/lib/admin/import/types";
import type { ImportPreview, ImportResult } from "@/lib/admin/import/types";
import { cn } from "@/lib/utils";

type Step = "upload" | "preview" | "importing" | "result";

type Progress = { processed: number; total: number };

const FORMAT_LABELS: Record<ImportPreview["format"], string> = {
  shopify: "Shopify",
  woocommerce: "WooCommerce",
  unknown: "פורמט לא מזוהה",
};

export function ImportWizard({ categories }: { categories: Category[] }) {
  const [step, setStep] = useState<Step>("upload");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id ?? "");
  const [fallbackImage, setFallbackImage] = useState("");
  const [downloadImages, setDownloadImages] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState<Progress>({ processed: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStep("upload");
    setPreview(null);
    setResult(null);
    setProgress({ processed: 0, total: 0 });
    setFallbackImage("");
  }

  function handleFile(file: File) {
    setParsing(true);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (res) => {
        setParsing(false);
        if (res.errors.length > 0 && !res.data.length) {
          toast.error("שגיאה בקריאת הקובץ — ודאו ש-encoding תקין (UTF-8)");
          return;
        }
        const headers =
          res.meta.fields?.map((f) => f.trim()).filter(Boolean) ?? [];
        const parsed = parseImportRows(headers, res.data);
        if (parsed.format === "unknown") {
          toast.error("פורמט לא מזוהה — תומכים כרגע ב-Shopify ו-WooCommerce");
          return;
        }
        if (parsed.products.length === 0) {
          toast.error("לא נמצאו מוצרים בקובץ");
          return;
        }
        setPreview(parsed);
        setStep("preview");
        toast.success(
          `זוהה: ${FORMAT_LABELS[parsed.format]} · ${parsed.products.length} מוצרים`,
        );
      },
      error: (err) => {
        setParsing(false);
        toast.error(`שגיאה: ${err.message}`);
      },
    });
  }

  async function runImport() {
    if (!preview) return;
    if (!categoryId) {
      toast.error("בחרו קטגוריה");
      return;
    }
    const total = preview.products.length;
    setProgress({ processed: 0, total });
    setStep("importing");

    const aggregated: ImportResult = {
      attempted: 0,
      created: 0,
      skipped: 0,
      errors: [],
    };

    for (let i = 0; i < total; i += IMPORT_BATCH_SIZE) {
      const batch = preview.products.slice(i, i + IMPORT_BATCH_SIZE);
      try {
        const res = await importProductBatch({
          products: batch,
          categoryId,
          fallbackImage: fallbackImage || undefined,
          downloadImages,
        });
        aggregated.attempted += res.processed;
        aggregated.created += res.created;
        aggregated.skipped += res.skipped;
        aggregated.errors.push(...res.errors);
      } catch (err) {
        // Network / server crash — record one error and keep going so a
        // single bad batch doesn't kill the whole import.
        aggregated.attempted += batch.length;
        for (const p of batch) {
          aggregated.errors.push({
            sku: p.sku,
            reason: err instanceof Error ? err.message : "שגיאת רשת",
          });
        }
      }
      setProgress({ processed: Math.min(i + IMPORT_BATCH_SIZE, total), total });
    }

    await finalizeImport();
    setResult(aggregated);
    setStep("result");
    if (aggregated.created > 0) {
      toast.success(`נוצרו ${aggregated.created} מוצרים`);
    }
  }

  return (
    <div className="space-y-6">
      <Stepper step={step} />

      {step === "upload" && (
        <StepUpload
          onFile={handleFile}
          parsing={parsing}
          fileInputRef={fileInputRef}
        />
      )}

      {step === "preview" && preview && (
        <StepPreview
          preview={preview}
          categories={categories}
          categoryId={categoryId}
          onCategoryChange={setCategoryId}
          fallbackImage={fallbackImage}
          onFallbackImageChange={setFallbackImage}
          downloadImages={downloadImages}
          onDownloadImagesChange={setDownloadImages}
          onBack={() => setStep("upload")}
          onImport={runImport}
        />
      )}

      {step === "importing" && (
        <StepImporting progress={progress} downloadImages={downloadImages} />
      )}

      {step === "result" && result && (
        <StepResult result={result} onReset={reset} />
      )}
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: "upload", label: "העלאה" },
    { id: "preview", label: "תצוגה מקדימה" },
    { id: "result", label: "סיכום" },
  ];
  // Treat "importing" as still on preview for the stepper UI
  const effective = step === "importing" ? "preview" : step;
  const currentIndex = steps.findIndex((s) => s.id === effective);

  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={s.id} className="flex items-center gap-2 flex-1">
            <div
              className={cn(
                "size-7 rounded-full inline-flex items-center justify-center text-xs font-medium tabular-nums shrink-0",
                done
                  ? "bg-brand-accent text-white"
                  : active
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {done ? <CheckCircle2 className="size-4" /> : i + 1}
            </div>
            <span
              className={cn(
                "text-sm",
                active ? "text-foreground font-medium" : "text-muted-foreground",
              )}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div className="flex-1 h-px bg-border" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepUpload({
  onFile,
  parsing,
  fileInputRef,
}: {
  onFile: (file: File) => void;
  parsing: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [dragging, setDragging] = useState(false);

  return (
    <div className="bg-card border border-border rounded-lg p-6 md:p-8">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) onFile(file);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
          dragging
            ? "border-brand-accent bg-brand-bg-soft/40"
            : "border-border hover:border-foreground/40 hover:bg-muted/40",
        )}
      >
        {parsing ? (
          <>
            <Loader2 className="size-10 mx-auto text-brand-accent animate-spin mb-3" />
            <div className="text-sm font-medium">מנתח קובץ...</div>
          </>
        ) : (
          <>
            <div className="size-12 rounded-full bg-brand-bg-soft dark:bg-muted mx-auto grid place-items-center mb-3">
              <Upload className="size-5 text-brand-accent" />
            </div>
            <div className="text-base font-medium mb-1">
              גרור קובץ CSV לכאן, או לחץ לבחירה
            </div>
            <div className="text-xs text-muted-foreground">
              תומך ב-Shopify ו-WooCommerce exports · עד 10MB
            </div>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <HelpCard
          icon={<FileSpreadsheet className="size-4" />}
          title="איך לייצא מ-Shopify"
          steps={[
            "Admin → Products → Export",
            "בחר 'All products' או נבחרים",
            "Export as: CSV for Excel",
            "הקובץ יישלח למייל שלך",
          ]}
        />
        <HelpCard
          icon={<FileSpreadsheet className="size-4" />}
          title="איך לייצא מ-WooCommerce"
          steps={[
            "WP Admin → Products → All Products",
            "כפתור 'Export' בראש הדף",
            "Generate CSV (בחר 'Simple' או 'All')",
            "הורד את הקובץ",
          ]}
        />
      </div>
    </div>
  );
}

function HelpCard({
  icon,
  title,
  steps,
}: {
  icon: React.ReactNode;
  title: string;
  steps: string[];
}) {
  return (
    <div className="bg-muted/40 border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-brand-accent">{icon}</div>
        <div className="text-sm font-medium">{title}</div>
      </div>
      <ol className="text-[12px] text-muted-foreground space-y-1 list-decimal pr-4 marker:text-muted-foreground/60">
        {steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
    </div>
  );
}

function StepPreview({
  preview,
  categories,
  categoryId,
  onCategoryChange,
  fallbackImage,
  onFallbackImageChange,
  downloadImages,
  onDownloadImagesChange,
  onBack,
  onImport,
}: {
  preview: ImportPreview;
  categories: Category[];
  categoryId: string;
  onCategoryChange: (v: string) => void;
  fallbackImage: string;
  onFallbackImageChange: (v: string) => void;
  downloadImages: boolean;
  onDownloadImagesChange: (v: boolean) => void;
  onBack: () => void;
  onImport: () => void;
}) {
  const sample = preview.products.slice(0, 8);
  const withoutImages = preview.products.filter((p) => !p.image).length;

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div className="bg-card border border-border rounded-lg p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="פורמט מזוהה" value={FORMAT_LABELS[preview.format]} />
        <Stat
          label="מוצרים בקובץ"
          value={preview.products.length.toLocaleString("he-IL")}
        />
        <Stat
          label="שורות גולמיות"
          value={preview.rowCount.toLocaleString("he-IL")}
        />
        <Stat
          label="ללא תמונה"
          value={withoutImages > 0 ? `${withoutImages}` : "0"}
          tone={withoutImages > 0 ? "warn" : "ok"}
        />
      </div>

      {/* Warnings */}
      {preview.warnings.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg p-4 flex gap-3">
          <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <div className="font-medium text-amber-900 dark:text-amber-200 mb-1">
              {preview.warnings.length} אזהרות במהלך הניתוח
            </div>
            <ul className="text-[12px] text-amber-800 dark:text-amber-300 space-y-0.5 max-h-32 overflow-y-auto list-disc pr-4">
              {preview.warnings.slice(0, 20).map((w, i) => (
                <li key={i}>{w}</li>
              ))}
              {preview.warnings.length > 20 && (
                <li className="opacity-60">...ועוד {preview.warnings.length - 20}</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Mapping */}
      <div className="bg-card border border-border rounded-lg p-5 md:p-6 space-y-4">
        <h3 className="text-sm font-medium">הגדרות ייבוא</h3>

        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-1.5">
            קטגוריה לכל המוצרים *
          </label>
          <Select value={categoryId} onValueChange={(v) => v && onCategoryChange(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {preview.categoryHints.length > 0 && (
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
              בקובץ נמצאו הקטגוריות:{" "}
              <span className="text-foreground">
                {preview.categoryHints.slice(0, 5).join(" · ")}
                {preview.categoryHints.length > 5 &&
                  ` +${preview.categoryHints.length - 5}`}
              </span>
              . בשלב זה כל המוצרים ישוייכו לקטגוריה אחת — תוכל לערוך אחר כך.
            </p>
          )}
        </div>

        {withoutImages > 0 && (
          <ImageUploadField
            label="תמונת ברירת מחדל (למוצרים בלי תמונה)"
            value={fallbackImage}
            onChange={onFallbackImageChange}
            purpose="import-fallback"
            aspect="square"
            help={`${withoutImages} מוצרים בקובץ ללא תמונה. אם לא תעלה תמונה כאן — הם יידלגו.`}
          />
        )}

        {/* Image download toggle — critical for long-term reliability */}
        <label className="flex items-start gap-3 pt-2 border-t border-border cursor-pointer">
          <Checkbox
            checked={downloadImages}
            onCheckedChange={() => onDownloadImagesChange(!downloadImages)}
            className="mt-1"
          />
          <div className="flex-1">
            <div className="text-sm font-medium flex items-center gap-2">
              <Download className="size-3.5 text-brand-accent" />
              הורד תמונות לאחסון שלנו
              <span className="text-[10px] uppercase tracking-wider text-brand-accent bg-brand-bg-soft dark:bg-muted px-1.5 py-0.5 rounded">
                מומלץ
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
              {downloadImages
                ? `כל תמונה תועתק ל-Vercel Blob שלך. הייבוא ייקח כ-1 שנייה לתמונה, אבל גם אם תסגור את החנות המקורית — התמונות יישארו זמינות באתר שלך.`
                : `התמונות יישארו על השרת המקורי. הייבוא יהיה מהיר יותר, אבל אם החנות המקורית תיסגר — התמונות באתר שלך יישברו.`}
            </p>
          </div>
        </label>

        {downloadImages && (
          <div className="bg-brand-bg-soft dark:bg-muted/50 border border-border rounded-md p-3 flex gap-2.5">
            <Info className="size-4 text-brand-accent shrink-0 mt-0.5" />
            <div className="text-[11px] text-muted-foreground leading-relaxed">
              <strong className="text-foreground font-medium">דורש Vercel Blob.</strong>{" "}
              ההורדה משתמשת בשירות אחסון של Vercel. אם לא הגדרת — ההורדה
              תידלג בשקט והתמונות יישארו עם ה-URL המקורי.
              <br />
              <span className="text-[10px]">
                להגדרה (פעם אחת):{" "}
                <a
                  href="https://vercel.com/docs/storage/vercel-blob/quickstart"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-brand-accent hover:underline"
                >
                  Vercel Dashboard → Storage → Connect Blob
                  <ExternalLink className="size-2.5" />
                </a>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Sample table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <div className="text-sm font-medium">
            תצוגה מקדימה ({sample.length} מתוך {preview.products.length})
          </div>
          <div className="text-[11px] text-muted-foreground">
            הצגת 8 הראשונים. כולם יעלו בייבוא.
          </div>
        </div>
        <table className="w-full">
          <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-right font-medium w-16">תמונה</th>
              <th className="px-4 py-2 text-right font-medium">שם / מק&quot;ט</th>
              <th className="px-4 py-2 text-right font-medium hidden md:table-cell">
                קטגוריה (מקור)
              </th>
              <th className="px-4 py-2 text-right font-medium">מחיר</th>
              <th className="px-4 py-2 text-right font-medium hidden sm:table-cell">
                מלאי
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sample.map((p) => (
              <tr key={p.sku}>
                <td className="px-4 py-2.5 align-middle">
                  <div className="relative size-10 rounded-md bg-muted overflow-hidden">
                    {p.image && (
                      <Image
                        src={p.image}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                        unoptimized
                      />
                    )}
                  </div>
                </td>
                <td className="px-4 py-2.5 align-middle">
                  <div className="font-medium text-sm truncate max-w-[260px]">
                    {p.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    {p.sku}
                  </div>
                </td>
                <td className="px-4 py-2.5 align-middle hidden md:table-cell text-[12px] text-muted-foreground">
                  {p.categoryHint || "—"}
                </td>
                <td className="px-4 py-2.5 align-middle text-sm font-semibold tabular-nums">
                  ₪{p.price.toLocaleString("he-IL")}
                  {p.originalPrice && (
                    <span className="block text-[10px] line-through text-muted-foreground font-normal">
                      ₪{p.originalPrice.toLocaleString("he-IL")}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 align-middle hidden sm:table-cell text-sm tabular-nums">
                  {p.stock}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pre-import warning: tab close behavior */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-md p-3">
        <div className="flex gap-2.5">
          <Info className="size-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
          <div className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
            <strong className="font-medium">לפני שמתחילים — אל תסגור את החלון במהלך הייבוא.</strong>{" "}
            הייבוא רץ מהדפדפן שלך ב-batches קטנים. אם תסגור את החלון
            באמצע — הלולאה נעצרת, אבל{" "}
            <strong className="font-medium">המוצרים שכבר נשמרו נשארים בבסיס הנתונים.</strong>{" "}
            אם זה קורה, פשוט תעלה את אותו קובץ שוב: מוצרים עם מק״ט קיים
            מדולגים אוטומטית, והייבוא ימשיך מהמקום שעצר.
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        <Button variant="outline" onClick={onBack}>
          <ArrowRight className="size-3.5" />
          חזרה
        </Button>
        <Button
          onClick={onImport}
          disabled={!categoryId}
          className="bg-foreground text-background hover:bg-foreground/90 gap-2"
        >
          ייבא {preview.products.length} מוצרים
          <ArrowLeft className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function StepImporting({
  progress,
  downloadImages,
}: {
  progress: Progress;
  downloadImages: boolean;
}) {
  const pct =
    progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0;
  const isDone = progress.processed >= progress.total && progress.total > 0;
  return (
    <div className="bg-card border border-border rounded-lg p-8 text-center">
      <div className="size-14 rounded-full bg-brand-bg-soft dark:bg-muted mx-auto grid place-items-center mb-4">
        <Loader2 className="size-6 text-brand-accent animate-spin" />
      </div>

      <h2 className="text-xl font-medium mb-1">
        {isDone ? "מסיים..." : "מייבא מוצרים..."}
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        {downloadImages
          ? "מוריד תמונות לאחסון שלך ושומר מוצרים בבסיס הנתונים"
          : "מייבא מוצרים בלי הורדת תמונות"}
      </p>

      {/* Progress bar */}
      <div className="max-w-md mx-auto">
        <div className="flex items-end justify-between text-sm tabular-nums mb-2">
          <span className="text-foreground font-medium">
            {progress.processed} / {progress.total} מוצרים
          </span>
          <span className="text-2xl font-semibold tabular-nums tracking-tight">
            {pct}%
          </span>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-gradient transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
          הייבוא רץ ב-batches של {IMPORT_BATCH_SIZE} מוצרים בכל פעם. תוצאה
          מלאה תוצג ברגע שהכל יסתיים.
        </p>
      </div>

      {/* Brief tab-close reminder */}
      <div className="max-w-md mx-auto mt-5 flex items-center justify-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400">
        <Info className="size-3.5 shrink-0" />
        <span>אל תסגור את החלון עד שהייבוא יסתיים</span>
      </div>
    </div>
  );
}

function StepResult({
  result,
  onReset,
}: {
  result: ImportResult;
  onReset: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <div className="size-14 rounded-full bg-emerald-100 dark:bg-emerald-950/50 mx-auto grid place-items-center mb-3">
          <CheckCircle2 className="size-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-xl font-medium mb-1">הייבוא הסתיים</h2>
        <p className="text-sm text-muted-foreground">
          ניסיון לייבוא {result.attempted.toLocaleString("he-IL")} מוצרים
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <ResultTile
          label="נוצרו"
          value={result.created}
          tone="ok"
          icon={<CheckCircle2 className="size-4" />}
        />
        <ResultTile
          label="דולגו (SKU קיים)"
          value={result.skipped}
          tone="neutral"
          icon={<ShoppingBag className="size-4" />}
        />
        <ResultTile
          label="שגיאות"
          value={result.errors.length}
          tone={result.errors.length > 0 ? "warn" : "neutral"}
          icon={<AlertTriangle className="size-4" />}
        />
      </div>

      {result.errors.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-medium mb-3">פירוט שגיאות</h3>
          <ul className="text-[12px] space-y-1 max-h-64 overflow-y-auto">
            {result.errors.map((e, i) => (
              <li key={i} className="flex gap-2">
                <code className="font-mono text-muted-foreground shrink-0">
                  {e.sku}
                </code>
                <span className="text-destructive">{e.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-between gap-3 pt-2">
        <Button variant="outline" onClick={onReset}>
          ייבוא קובץ נוסף
        </Button>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background text-sm font-medium rounded-md hover:bg-foreground/90 transition-colors no-underline"
        >
          לצפייה במוצרים
          <ArrowLeft className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "ok" | "warn" | "neutral";
}) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground uppercase tracking-wider">
        {label}
      </div>
      <div
        className={cn(
          "text-xl font-semibold tabular-nums mt-1",
          tone === "ok" && "text-emerald-600 dark:text-emerald-400",
          tone === "warn" && "text-amber-600 dark:text-amber-400",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function ResultTile({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: "ok" | "warn" | "neutral";
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div
        className={cn(
          "inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider mb-2",
          tone === "ok"
            ? "text-emerald-600 dark:text-emerald-400"
            : tone === "warn"
              ? "text-amber-600 dark:text-amber-400"
              : "text-muted-foreground",
        )}
      >
        {icon}
        {label}
      </div>
      <div className="text-2xl font-semibold tabular-nums">
        {value.toLocaleString("he-IL")}
      </div>
    </div>
  );
}
