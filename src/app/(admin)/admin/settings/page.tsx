import type { Metadata } from "next";
import { Info } from "lucide-react";
import { getSiteSettings } from "@/lib/site-settings";
import { SettingsForm } from "./_components/settings-form";

export const metadata: Metadata = {
  title: "הגדרות",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="p-4 md:p-8 max-w-[1100px]">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground">
          הגדרות
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          ערוך את פרטי החנות בלי לגעת בקוד. השינויים נכנסים לתוקף תוך כמה שניות.
        </p>
      </div>

      <div className="mb-6 bg-brand-bg-soft dark:bg-muted border border-border rounded-lg p-4 flex gap-3">
        <Info className="size-5 text-brand-accent shrink-0 mt-0.5" />
        <div className="text-sm">
          <div className="font-medium text-foreground mb-1">
            איך ההגדרות פועלות
          </div>
          <div className="text-muted-foreground leading-relaxed">
            ערכים שתשמור פה מחליפים את ברירות המחדל מהקובץ{" "}
            <code className="bg-background border border-border px-1 py-0.5 rounded text-[11px]">
              site-config.ts
            </code>
            . הם נשמרים ב-DB עם cache קצר (5 דקות) — כך שהאתר מהיר אבל מתעדכן
            תוך כמה שניות אחרי שמירה. הודעת החנות, דף הקשר וטלפונים יתעדכנו
            מיידית.
          </div>
        </div>
      </div>

      <SettingsForm initial={settings} />
    </div>
  );
}
