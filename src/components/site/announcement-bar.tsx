import { getSiteSettings } from "@/lib/site-settings";

export async function AnnouncementBar() {
  const settings = await getSiteSettings();
  if (!settings.announcement) return null;
  return (
    <div
      role="region"
      aria-label="הודעת חנות"
      className="bg-brand-primary text-white text-center text-[0.72rem] tracking-[0.18em] py-2.5 px-4"
    >
      {settings.announcement}
    </div>
  );
}
