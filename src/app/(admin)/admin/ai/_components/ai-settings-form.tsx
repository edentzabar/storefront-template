"use client";

import { useState, useTransition } from "react";
import { Save, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateSiteSettings } from "@/lib/admin/settings-actions";
import type { EditableSettings } from "@/lib/site-settings";

/**
 * Standalone form for AI + chatbot settings — lives at /admin/ai
 * instead of being a section inside /admin/settings, so this whole
 * surface can grow (cost tracking, model picker per-feature, prompt
 * library, etc.) without bloating the general settings page.
 */
export function AiSettingsForm({
  initial,
  apiKeyConfigured,
}: {
  initial: EditableSettings;
  /** True when an AI key is set on the server (DB or env). The actual
   *  value is never sent to the browser. */
  apiKeyConfigured: boolean;
}) {
  const [values, setValues] = useState({
    "ai.enabled": initial.ai.enabled ? "true" : "false",
    "ai.provider": initial.ai.provider,
    // SECURITY: starts empty. An empty submission is interpreted as
    // "leave the existing key untouched" by handleSubmit below.
    "ai.apiKey": "",
    "ai.model": initial.ai.model,
    "chatbot.enabled": initial.chatbot.enabled ? "true" : "false",
    "chatbot.welcomeMessage": initial.chatbot.welcomeMessage,
    "chatbot.systemPromptExtra": initial.chatbot.systemPromptExtra,
    "chatbot.position": initial.chatbot.position,
  });
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const set = (key: keyof typeof values) => (v: string) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      // If the user didn't type a new API key, omit the field from the
      // payload so the server keeps the existing one rather than
      // overwriting it with an empty string. Saves the merchant from
      // accidentally erasing the key by re-saving the form.
      const payload: Record<string, string> = { ...values };
      if (payload["ai.apiKey"] === "") delete payload["ai.apiKey"];
      const result = await updateSiteSettings(payload);
      if (result.ok) {
        toast.success("ההגדרות נשמרו");
        setSavedAt(Date.now());
        // Wipe the new-key input from memory after save.
        setValues((prev) => ({ ...prev, "ai.apiKey": "" }));
      } else {
        toast.error(result.error ?? "שגיאה בשמירה");
      }
    });
  }

  const justSaved = savedAt && Date.now() - savedAt < 3000;
  const aiOn = values["ai.enabled"] === "true";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Section
        title="ספק AI"
        description="כל פיצ׳רי ה-AI באתר עוברים דרך כאן, תיאור אוטומטי, צ׳אטבוט, וכל מה שיתווסף בעתיד."
        icon={<Sparkles className="size-4 text-brand-accent" />}
      >
        <ToggleField
          label="הפעל AI"
          value={values["ai.enabled"]}
          onChange={set("ai.enabled")}
          help="כשכבוי, כפתורי ה-AI באדמין מציגים הודעה, ולא רצים."
        />
        <div className={aiOn ? "" : "opacity-50 pointer-events-none"}>
          <Grid>
            <SelectField
              label="ספק"
              value={values["ai.provider"]}
              onChange={set("ai.provider")}
              options={[
                { value: "", label: "בחר ספק" },
                { value: "anthropic", label: "Anthropic (Claude)" },
                { value: "openai", label: "OpenAI (GPT)" },
                { value: "google", label: "Google (Gemini)" },
              ]}
              help="כרגע רק Anthropic מחובר במלואו, האחרים stubs."
            />
            <Field
              label="מודל (לא חובה)"
              value={values["ai.model"]}
              onChange={set("ai.model")}
              help="ריק = ברירת מחדל של הספק. למשל claude-sonnet-4-5"
            />
          </Grid>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              API Key
            </Label>
            <div className="mt-1.5 flex items-center gap-2">
              <span
                className={
                  apiKeyConfigured
                    ? "text-xs px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground"
                }
              >
                {apiKeyConfigured ? "✓ מוגדר" : "לא מוגדר"}
              </span>
            </div>
            <Input
              type="password"
              placeholder={apiKeyConfigured ? "הזיני מפתח חדש כדי להחליף" : "הדביקי את המפתח כאן"}
              value={values["ai.apiKey"]}
              onChange={(e) => set("ai.apiKey")(e.target.value)}
              className="mt-2"
              autoComplete="off"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              ריק = ייקרא ממשתנה הסביבה (ANTHROPIC_API_KEY וכו׳). מומלץ env בפרודקשן.
              הערך עצמו לא מוצג, להחלפה הקלידי מפתח חדש.
            </p>
          </div>
        </div>
      </Section>

      <Section
        title="צ׳אטבוט בחנות"
        description="באלון צף בפינה. דורש AI מופעל למעלה."
      >
        <ToggleField
          label="הצג צ׳אטבוט בחנות"
          value={values["chatbot.enabled"]}
          onChange={set("chatbot.enabled")}
        />
        <div
          className={
            values["chatbot.enabled"] === "true" ? "" : "opacity-50 pointer-events-none"
          }
        >
          <Grid>
            <SelectField
              label="פינה"
              value={values["chatbot.position"]}
              onChange={set("chatbot.position")}
              options={[
                { value: "bottom-right", label: "ימין-תחתון" },
                { value: "bottom-left", label: "שמאל-תחתון" },
              ]}
            />
            <Field
              label="הודעת פתיחה"
              value={values["chatbot.welcomeMessage"]}
              onChange={set("chatbot.welcomeMessage")}
              multiline
            />
          </Grid>
          <Field
            label="הנחיות מערכת נוספות (לא חובה)"
            value={values["chatbot.systemPromptExtra"]}
            onChange={set("chatbot.systemPromptExtra")}
            help="טון, נוסחאות בטיחות, פרטים שאתה רוצה שהבוט יידע. מתווסף ל-system prompt הבסיסי שמכיל מותג, מדיניות וקטלוג."
            multiline
          />
        </div>
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
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card border border-border rounded-lg overflow-hidden">
      <header className="px-5 md:px-6 py-4 border-b border-border flex items-center gap-2.5">
        {icon}
        <div>
          <h2 className="text-sm font-medium">{title}</h2>
          {description && (
            <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
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
  multiline,
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
      {help && <p className="text-[11px] text-muted-foreground mt-1">{help}</p>}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  help,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  help?: string;
}) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {help && <p className="text-[11px] text-muted-foreground mt-1">{help}</p>}
    </div>
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
