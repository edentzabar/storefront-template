"use client";

import { useState, useTransition } from "react";
import { Save, Check } from "lucide-react";
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
    "brand.tagline": initial.brand.tagline,
    "brand.logoUrl": initial.brand.logoUrl,
    "contact.phone": initial.contact.phone,
    "contact.phoneIntl": initial.contact.phoneIntl,
    "contact.email": initial.contact.email,
    "contact.address": initial.contact.address,
    "contact.instagram": initial.contact.instagram,
    "contact.whatsapp": initial.contact.whatsapp,
    "shop.freeShippingMin": String(initial.shop.freeShippingMin),
    "shop.warranty": initial.shop.warranty,
    "shop.maxInstallments": String(initial.shop.maxInstallments),
    "shop.returnDays": String(initial.shop.returnDays),
    "shop.shippingDays": initial.shop.shippingDays,
    "hero.image": initial.hero.image,
    "hero.eyebrow": initial.hero.eyebrow,
    "hero.titleBefore": initial.hero.titleBefore,
    "hero.titleAccent": initial.hero.titleAccent,
    "hero.subtitle": initial.hero.subtitle,
    "hero.ctaText": initial.hero.ctaText,
    "hero.ctaHref": initial.hero.ctaHref,
    announcement: initial.announcement,
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

      <Section title="המותג" description="שם, טאגליין, לוגו">
        <Grid>
          <Field
            label="שם החנות"
            value={values["brand.name"]}
            onChange={set("brand.name")}
            help="מופיע בלוגו, כותרות עמודים ומטא-data"
          />
          <Field
            label="טאגליין"
            value={values["brand.tagline"]}
            onChange={set("brand.tagline")}
            help="טקסט קטן מתחת ללוגו"
          />
        </Grid>
        <ImageUploadField
          label="לוגו (אופציונלי)"
          value={values["brand.logoUrl"]}
          onChange={set("brand.logoUrl")}
          purpose="logo"
          aspect="wide"
          help="PNG/SVG מומלץ עם רקע שקוף. אם משאירים ריק — מוצג שם המותג כטקסט מעוצב."
        />
      </Section>

      <Section title="באנר ראשי (Hero)" description="הסקציה הגדולה בראש דף הבית">
        <ImageUploadField
          label="תמונת רקע"
          value={values["hero.image"]}
          onChange={set("hero.image")}
          purpose="hero"
          aspect="wide"
          help="מומלץ 2000×1200px לפחות, JPG/WebP. תוצג בפול-וויות עם אפקט זום עדין."
        />
        <Grid>
          <Field
            label="כותרת קטנה (Eyebrow)"
            value={values["hero.eyebrow"]}
            onChange={set("hero.eyebrow")}
            help='למשל "מבצע מיוחד"'
          />
          <Field
            label="טקסט הכפתור"
            value={values["hero.ctaText"]}
            onChange={set("hero.ctaText")}
            help='למשל "לקולקציה"'
          />
        </Grid>
        <Grid>
          <Field
            label="כותרת ראשית — חלק רגיל"
            value={values["hero.titleBefore"]}
            onChange={set("hero.titleBefore")}
            help='למשל "על כל "'
          />
          <Field
            label="כותרת ראשית — חלק מודגש"
            value={values["hero.titleAccent"]}
            onChange={set("hero.titleAccent")}
            help='הטקסט בזהב — למשל "החנות"'
          />
        </Grid>
        <Field
          label="תיאור"
          value={values["hero.subtitle"]}
          onChange={set("hero.subtitle")}
          multiline
          help="טקסט קצר מתחת לכותרת"
        />
        <Field
          label="קישור הכפתור"
          value={values["hero.ctaHref"]}
          onChange={set("hero.ctaHref")}
          help='נתיב פנימי (#categories) או לעמוד אחר (/shop)'
        />
      </Section>

      <Section title="איש קשר" description="פרטי קשר עם הסטודיו">
        <Grid>
          <Field
            label="טלפון (להצגה)"
            value={values["contact.phone"]}
            onChange={set("contact.phone")}
            help="כפי שיוצג ללקוחות"
          />
          <Field
            label="טלפון בינלאומי (להתקשרות)"
            value={values["contact.phoneIntl"]}
            onChange={set("contact.phoneIntl")}
            help="עם קידומת מדינה, ללא רווחים — למשל +972501234567"
          />
        </Grid>
        <Field
          label="אימייל"
          type="email"
          value={values["contact.email"]}
          onChange={set("contact.email")}
        />
        <Field
          label="כתובת הסטודיו"
          value={values["contact.address"]}
          onChange={set("contact.address")}
        />
        <Grid>
          <Field
            label="Instagram URL"
            value={values["contact.instagram"]}
            onChange={set("contact.instagram")}
            help="קישור מלא לפרופיל"
          />
          <Field
            label="WhatsApp URL"
            value={values["contact.whatsapp"]}
            onChange={set("contact.whatsapp")}
            help="wa.me/972XXXXXXXXX"
          />
        </Grid>
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
            help="טקסט חופשי — למשל ‎2-4 ימי עסקים"
          />
        </Grid>
        <Field
          label="טקסט אחריות"
          value={values["shop.warranty"]}
          onChange={set("shop.warranty")}
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
