import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/site-settings";
import { AiSettingsForm } from "./_components/ai-settings-form";

export const metadata: Metadata = {
  title: "AI",
};

export default async function AdminAiPage() {
  const settings = await getSiteSettings();

  // SECURITY: Never send the actual AI API key to the client. The
  // form needs to know IF a key exists (so it can show "מוגדר"),
  // but not what it is. Even leaking it to the admin's browser is
  // unnecessary risk — XSS / extension / screen-share / shoulder
  // surfing all become a key leak.
  const apiKeyConfigured = Boolean(settings.ai.apiKey);
  const safeSettings = {
    ...settings,
    ai: { ...settings.ai, apiKey: "" },
  };

  return (
    <div className="max-w-[1100px] mx-auto p-4 md:p-8 space-y-4">
      <header>
        <h1 className="text-xl font-semibold">AI & אוטומציה</h1>
        <p className="text-sm text-muted-foreground mt-1">
          חיבור ספק AI, יצירת תיאורים אוטומטית מתמונה, והגדרות הצ׳אטבוט שמופיע בחנות.
        </p>
      </header>
      <AiSettingsForm initial={safeSettings} apiKeyConfigured={apiKeyConfigured} />
    </div>
  );
}
