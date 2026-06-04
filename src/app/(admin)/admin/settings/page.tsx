import type { Metadata } from "next";
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
          ערוך את פרטי החנות. השינויים נכנסים לתוקף תוך כמה שניות.
        </p>
      </div>

      <SettingsForm initial={settings} />
    </div>
  );
}
