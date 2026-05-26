"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import type {
  PopupAudience,
  PopupCampaign,
  PopupFrequency,
  PopupPage,
  PopupTrigger,
} from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { createPopup, updatePopup } from "@/lib/admin/popups-actions";
import { PopupPreview } from "./popup-preview";

const TRIGGERS: { value: PopupTrigger; label: string; help: string }[] = [
  { value: "delay", label: "השהיה (שניות)", help: "מספר שניות בעמוד לפני שהפופאפ קופץ" },
  {
    value: "exit_intent",
    label: "כוונת יציאה (Exit intent)",
    help: "כשהעכבר יוצא מחלון הדפדפן (כאילו הלקוח רוצה לעזוב)",
  },
  { value: "scroll", label: "גלילה (אחוזים)", help: "אחרי שהלקוח גלל אחוז מהדף" },
];

const FREQUENCIES: { value: PopupFrequency; label: string; help: string }[] = [
  { value: "session", label: "פעם ב-session", help: "עד שהלקוח סוגר את החלון" },
  { value: "days", label: "פעם בכמה ימים", help: "לא יוצג שוב למספר ימים שנבחר" },
  { value: "once", label: "פעם אחת לעולם", help: "אם הלקוח ראה — לא יראה שוב לעולם" },
];

const AUDIENCES: { value: PopupAudience; label: string }[] = [
  { value: "all", label: "כל הלקוחות" },
  { value: "guest", label: "רק לקוחות לא רשומים" },
  { value: "registered", label: "רק לקוחות רשומים" },
];

const PAGES: { value: PopupPage; label: string }[] = [
  { value: "all", label: "כל הדפים" },
  { value: "home", label: "רק דף הבית" },
  { value: "product", label: "רק עמודי מוצר" },
  { value: "category", label: "רק עמודי קטגוריה" },
];

export function PopupForm({ popup }: { popup?: PopupCampaign | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState(popup?.name ?? "");
  const [title, setTitle] = useState(popup?.title ?? "");
  const [body, setBody] = useState(popup?.body ?? "");
  const [imageUrl, setImageUrl] = useState(popup?.imageUrl ?? "");
  const [ctaText, setCtaText] = useState(popup?.ctaText ?? "");
  const [ctaUrl, setCtaUrl] = useState(popup?.ctaUrl ?? "");
  const [couponCode, setCouponCode] = useState(popup?.couponCode ?? "");

  const [triggerType, setTriggerType] = useState<PopupTrigger>(popup?.triggerType ?? "delay");
  const [triggerValue, setTriggerValue] = useState(String(popup?.triggerValue ?? 5));

  const [frequencyType, setFrequencyType] = useState<PopupFrequency>(
    popup?.frequencyType ?? "session",
  );
  const [frequencyDays, setFrequencyDays] = useState(String(popup?.frequencyDays ?? 7));

  const [audience, setAudience] = useState<PopupAudience>(popup?.audience ?? "all");
  const [pageTarget, setPageTarget] = useState<PopupPage>(popup?.pageTarget ?? "all");

  const [startsAt, setStartsAt] = useState(
    popup?.startsAt ? format(popup.startsAt, "yyyy-MM-dd") : "",
  );
  const [endsAt, setEndsAt] = useState(
    popup?.endsAt ? format(popup.endsAt, "yyyy-MM-dd") : "",
  );
  const [isActive, setIsActive] = useState(popup?.isActive ?? false);

  const triggerValueLabel =
    triggerType === "delay"
      ? "שניות עד הופעה"
      : triggerType === "scroll"
        ? "אחוז גלילה"
        : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const input = {
        name,
        title,
        body,
        imageUrl,
        ctaText,
        ctaUrl,
        couponCode,
        triggerType,
        triggerValue: Number(triggerValue),
        frequencyType,
        frequencyDays: Number(frequencyDays),
        audience,
        pageTarget,
        startsAt: startsAt || null,
        endsAt: endsAt || null,
        isActive,
      };
      const result = popup
        ? await updatePopup(popup.id, input)
        : await createPopup(input);
      if (result.ok) {
        toast.success(popup ? "הפופאפ עודכן" : "הפופאפ נוצר");
        router.push("/admin/popups");
      } else {
        toast.error(result.error ?? "שגיאה");
      }
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Content */}
        <section className="bg-card border border-border rounded-lg p-5 md:p-6 space-y-4">
          <h2 className="text-sm font-medium">תוכן</h2>
          <Grid>
            <Field label="שם פנימי *" help="לזיהוי בלבד באדמין">
              <Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
            </Field>
            <Field label="כותרת *" help="הטקסט הגדול במרכז הפופאפ">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={120}
              />
            </Field>
          </Grid>
          <Field label="טקסט הגוף *" help="פירוט קצר. תומך בכמה שורות.">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={3}
              maxLength={800}
            />
          </Field>
          <ImageUploadField
            label="תמונה (אופציונלי)"
            value={imageUrl}
            onChange={setImageUrl}
            purpose="popup"
            aspect="wide"
            help="מומלץ 1200×675 (16:9). אם ריק — הפופאפ יוצג בלי תמונה."
          />
        </section>

        {/* CTA */}
        <section className="bg-card border border-border rounded-lg p-5 md:p-6 space-y-4">
          <h2 className="text-sm font-medium">כפתור קריאה לפעולה (CTA)</h2>
          <Grid>
            <Field label="טקסט הכפתור" help='למשל: "קבלו 10% הנחה"'>
              <Input
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                maxLength={40}
              />
            </Field>
            <Field label="קישור" help="לאן הכפתור מוביל. למשל /shop או /category/rings">
              <Input
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                dir="ltr"
                placeholder="/shop"
                maxLength={500}
              />
            </Field>
          </Grid>
          <Field label="קוד הנחה (אופציונלי)" help="יוצג בולט בפופאפ. תואם לקופון שיצרת.">
            <Input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              className="font-mono uppercase"
              dir="ltr"
              maxLength={40}
            />
          </Field>
        </section>

        {/* Trigger */}
        <section className="bg-card border border-border rounded-lg p-5 md:p-6 space-y-4">
          <h2 className="text-sm font-medium">מתי הפופאפ קופץ?</h2>
          <Grid>
            <Field label="סוג טריגר">
              <Select
                value={triggerType}
                onValueChange={(v) => setTriggerType(v as PopupTrigger)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGERS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {triggerValueLabel && (
              <Field
                label={triggerValueLabel}
                help={
                  triggerType === "delay"
                    ? "השהיה בשניות (1–600)"
                    : "אחוז גלילה (1–100)"
                }
              >
                <Input
                  type="number"
                  value={triggerValue}
                  onChange={(e) => setTriggerValue(e.target.value)}
                  min={1}
                  max={triggerType === "scroll" ? 100 : 600}
                  className="tabular-nums"
                />
              </Field>
            )}
          </Grid>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {TRIGGERS.find((t) => t.value === triggerType)?.help}
          </p>
        </section>

        {/* Frequency */}
        <section className="bg-card border border-border rounded-lg p-5 md:p-6 space-y-4">
          <h2 className="text-sm font-medium">כמה פעמים להראות לאותו לקוח?</h2>
          <Grid>
            <Field label="תדירות">
              <Select
                value={frequencyType}
                onValueChange={(v) => setFrequencyType(v as PopupFrequency)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {frequencyType === "days" && (
              <Field label="מספר ימים" help="לא יוצג שוב למספר ימים שתבחר (1–365)">
                <Input
                  type="number"
                  value={frequencyDays}
                  onChange={(e) => setFrequencyDays(e.target.value)}
                  min={1}
                  max={365}
                  className="tabular-nums"
                />
              </Field>
            )}
          </Grid>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {FREQUENCIES.find((t) => t.value === frequencyType)?.help}
          </p>
        </section>

        {/* Targeting */}
        <section className="bg-card border border-border rounded-lg p-5 md:p-6 space-y-4">
          <h2 className="text-sm font-medium">למי ואיפה להציג?</h2>
          <Grid>
            <Field label="קהל יעד">
              <Select value={audience} onValueChange={(v) => setAudience(v as PopupAudience)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCES.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="דפים">
              <Select value={pageTarget} onValueChange={(v) => setPageTarget(v as PopupPage)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </Grid>
          <Grid>
            <Field label="תאריך התחלה" help="אופציונלי — לקמפיינים מתוזמנים">
              <Input
                type="date"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </Field>
            <Field label="תאריך סיום" help="אופציונלי — אחרי תאריך זה הפופאפ נכבה אוטומטית">
              <Input
                type="date"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                min={startsAt}
              />
            </Field>
          </Grid>
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div>
              <Label className="text-sm">פעיל</Label>
              <p className="text-[11px] text-muted-foreground">
                כשפעיל, הפופאפ יופיע ללקוחות לפי ההגדרות
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </section>

        <div className="flex items-center justify-end gap-2 pb-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/popups")}
          >
            ביטול
          </Button>
          <Button
            type="submit"
            disabled={pending}
            className="bg-foreground text-background hover:bg-foreground/90"
          >
            {pending ? "שומר..." : popup ? "שמור שינויים" : "צור פופאפ"}
          </Button>
        </div>
      </form>

      {/* Sticky live preview */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
            תצוגה מקדימה
          </div>
          <PopupPreview
            title={title}
            body={body}
            imageUrl={imageUrl}
            ctaText={ctaText}
            ctaUrl={ctaUrl}
            couponCode={couponCode}
          />
          <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed">
            כך הפופאפ ייראה ללקוחות. הסגירה (X) פעילה רק בסטורפרונט.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

function Field({
  label,
  children,
  help,
}: {
  label: string;
  children: React.ReactNode;
  help?: string;
}) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <div className="mt-1.5">{children}</div>
      {help && <p className="text-[11px] text-muted-foreground mt-1">{help}</p>}
    </div>
  );
}
