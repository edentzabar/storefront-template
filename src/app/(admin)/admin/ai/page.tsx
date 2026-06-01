import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/site-settings";
import { AiSettingsForm } from "./_components/ai-settings-form";

export const metadata: Metadata = {
  title: "AI",
};

export default async function AdminAiPage() {
  const settings = await getSiteSettings();
  return (
    <div className="max-w-[1100px] mx-auto p-4 md:p-8 space-y-4">
      <header>
        <h1 className="text-xl font-semibold">AI & אוטומציה</h1>
        <p className="text-sm text-muted-foreground mt-1">
          חיבור ספק AI, יצירת תיאורים אוטומטית מתמונה, והגדרות הצ׳אטבוט שמופיע בחנות.
        </p>
      </header>
      <AiSettingsForm initial={settings} />
    </div>
  );
}
