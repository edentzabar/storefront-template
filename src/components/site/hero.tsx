import Image from "next/image";
import { getSiteSettings } from "@/lib/site-settings";

/**
 * Hero: a single, full-bleed banner image. No overlays, no headlines,
 * no CTA — the merchant designs the message into the image itself
 * (text, button, mood). Simpler to manage, more flexible visually,
 * and consistent with how modern shops (Aritzia, Glossier, Sézane)
 * are now treating the homepage hero.
 *
 * Sizing matches the previous overlaid hero exactly (78vh, clamped
 * 540–720px) so removing the overlays didn't change the visual
 * footprint on the page.
 */
export async function Hero() {
  const settings = await getSiteSettings();
  const hero = settings.hero;

  if (!hero.image) return null;

  return (
    <section
      aria-label="באנר ראשי"
      className="relative h-[78vh] min-h-[540px] max-h-[720px] overflow-hidden"
    >
      <Image
        src={hero.image}
        alt={settings.brand.name}
        fill
        priority
        sizes="100vw"
        className="object-cover"
        unoptimized={hero.image.startsWith("http") && !hero.image.includes("vercel-storage.com")}
      />
    </section>
  );
}
