"use client";

import { useState, useTransition } from "react";
import { Save, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { EditableSettings } from "@/lib/site-settings";
import { updateSiteSettings } from "@/lib/admin/settings-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadField } from "@/components/admin/image-upload-field";

export function SettingsForm({ initial }: { initial: EditableSettings }) {
  const [values, setValues] = useState({
    "brand.name": initial.brand.name,
    "brand.logoUrl": initial.brand.logoUrl,
    "shop.freeShippingMin": String(initial.shop.freeShippingMin),
    "shop.warranty": initial.shop.warranty,
    "shop.maxInstallments": String(initial.shop.maxInstallments),
    "shop.returnDays": String(initial.shop.returnDays),
    "shop.shippingDays": initial.shop.shippingDays,
    "hero.image": initial.hero.image,
    announcement: initial.announcement,
    // NOTE: AI + chatbot moved to /admin/ai — see ai-settings-form.
    // NOTE: contact details (phone/email/address/instagram/whatsapp/intro/hours)
    // intentionally removed from this form. The merchant edits those
    // directly in src/lib/data/static-pages.ts + src/lib/site-config.ts
    // per the project owner's preference.
    "products.skuEnabled": initial.products.skuEnabled ? "true" : "false",
  });
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const set = (key: string) => (v: string) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateSiteSettings(values);
      if (result.ok) {
        toast.success("ההגדרות נשמרו · החנות תתעדכן תוך כמה שניות");
        setSavedAt(Date.now());
      } else {
        toast.error(result.error ?? "שגיאה בשמירה");
      }
    });
  }

  const justSaved = savedAt && Date.now() - savedAt < 3000;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Section title="הודעת חנות" description="הסרגל השחור בראש האתר">
        <Field
          label="טקסט ההודעה"
          help="מופיע בראש כל עמוד באתר. השאר ריק כדי להסתיר."
          value={values["announcement"]}
          onChange={set("announcement")}
          multiline
        />
      </Section>

      <Section title="המותג" description="שם ולוגו">
        <Field
          label="שם החנות"
          value={values["brand.name"]}
          onChange={set("brand.name")}
          help="מופיע בכותרות עמודים ובמטא-data"
        />
        <ImageUploadField
          label="לוגו (אופציונלי)"
          value={values["brand.logoUrl"]}
          onChange={set("brand.logoUrl")}
          purpose="logo"
          aspect="wide"
          help="PNG/SVG מומלץ עם רקע שקוף. אם משאירים ריק, מוצג שם המותג כטקסט מעוצב."
        />
      </Section>

      <Section title="באנר ראשי (Hero)" description="התמונה הגדולה בראש דף הבית">
        <ImageUploadField
          label="תמונת הבאנר"
          value={values["hero.image"]}
          onChange={set("hero.image")}
          purpose="hero"
          aspect="wide"
          help="מומלץ 2000×1200px לפחות, JPG/WebP. הכל בתוך התמונה. בלי כיתובים נוספים מעל."
        />
        <button
          type="button"
          onClick={() =>
            toast.info("בקרוב: יצירת באנר עם AI", {
              description: "ניתן יהיה לתאר את הבאנר במילים והמערכת תייצר תמונה.",
            })
          }
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-dashed border-brand-accent/50 bg-brand-bg-soft/40 text-sm text-brand-text hover:bg-brand-accent/10 hover:border-brand-accent transition-colors"
        >
          <Sparkles className="size-4 text-brand-accent" />
          צור עם AI
        </button>
      </Section>

      <Section title="מדיניות חנות" description="פרטים שמופיעים בעגלה ובדפי המוצרים">
        <Grid>
          <Field
            label="משלוח חינם מעל (₪)"
            type="number"
            value={values["shop.freeShippingMin"]}
            onChange={set("shop.freeShippingMin")}
            help="סכום עגלה מינימלי למשלוח חינם"
          />
          <Field
            label="מקסימום תשלומים"
            type="number"
            value={values["shop.maxInstallments"]}
            onChange={set("shop.maxInstallments")}
            help="מס׳ תשלומים ללא ריבית"
          />
        </Grid>
        <Grid>
          <Field
            label="ימי החזרה"
            type="number"
            value={values["shop.returnDays"]}
            onChange={set("shop.returnDays")}
          />
          <Field
            label="זמן אספקה"
            value={values["shop.shippingDays"]}
            onChange={set("shop.shippingDays")}
            help="טקסט חופשי, למשל ‎2-4 ימי עסקים"
          />
        </Grid>
        <Field
          label="טקסט אחריות"
          value={values["shop.warranty"]}
          onChange={set("shop.warranty")}
        />
      </Section>

      <Section
        title="מוצרים"
        description="התנהגות טופס המוצר באדמין"
      >
        <ToggleField
          label="עבודה עם מק״ט"
          value={values["products.skuEnabled"]}
          onChange={set("products.skuEnabled")}
          help="כשמופעל, יופיע סקשן מק״ט בטופס המוצר. לכל מוצר תוכל לסמן אם הוא דורש מק״ט (לא חייב)."
        />
      </Section>

      <div className="sticky bottom-0 -mx-4 md:-mx-8 mt-6 px-4 md:px-8 py-3 bg-background/95 backdrop-blur border-t border-border flex items-center justify-end gap-3">
        {justSaved && (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <Check className="size-3.5" />
            נשמר
          </span>
        )}
        <Button
          type="submit"
          disabled={pending}
          className="bg-foreground text-background hover:bg-foreground/90 gap-2"
        >
          <Save className="size-4" />
          {pending ? "שומר..." : "שמור שינויים"}
        </Button>
      </div>
    </form>
  );
}

function ToggleField({
  label,
  value,
  onChange,
  help,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  help?: string;
}) {
  const checked = value === "true";
  return (
    <div className="flex items-start gap-3">
      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked ? "true" : "false")}
          className="size-4 accent-foreground cursor-pointer"
        />
        <span className="text-sm">{label}</span>
      </label>
      {help && <p className="text-[11px] text-muted-foreground self-center">{help}</p>}
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card border border-border rounded-lg overflow-hidden">
      <header className="px-5 md:px-6 py-4 border-b border-border">
        <h2 className="text-sm font-medium">{title}</h2>
        {description && (
          <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
        )}
      </header>
      <div className="p-5 md:p-6 space-y-4">{children}</div>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  help,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  help?: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {multiline ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="mt-1.5"
        />
      ) : (
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1.5"
        />
      )}
      {help && (
        <p className="text-[11px] text-muted-foreground mt-1">{help}</p>
      )}
    </div>
  );
}
