import Link from "next/link";
import Image from "next/image";
import { getSiteSettings } from "@/lib/site-settings";

export async function Hero() {
  const settings = await getSiteSettings();
  const hero = settings.hero;

  return (
    <section
      aria-label="באנר מבצע מיוחד"
      className="relative h-[78vh] min-h-[540px] max-h-[720px] overflow-hidden flex items-center justify-center"
    >
      <Image
        src={hero.image}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover animate-[heroZoom_25s_ease-in-out_infinite_alternate] scale-105"
        unoptimized={hero.image.startsWith("http") && !hero.image.includes("vercel-storage.com")}
      />
      <div className="absolute inset-0 pointer-events-none [background:radial-gradient(ellipse_at_center,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0.65)_100%),linear-gradient(to_bottom,rgba(0,0,0,0.15)_0%,rgba(0,0,0,0.25)_100%)]" />

      <div className="relative z-10 max-w-[760px] px-8 text-center animate-[fadeUp_1.4s_cubic-bezier(0.16,1,0.3,1)]">
        {/* Logo */}
        <div className="mb-7">
          <div className="font-display text-[clamp(1.4rem,2vw,1.7rem)] font-medium tracking-[0.32em] text-gold-grad inline-block pt-[0.1em] pb-[0.1em] pl-[0.5em] pr-[0.4em] leading-[1.3] [filter:drop-shadow(0_2px_8px_rgba(0,0,0,0.4))]">
            {settings.brand.name}
          </div>
          <div className="font-body text-[0.55rem] tracking-[0.45em] text-brand-accent-light uppercase -mt-px [text-shadow:0_2px_6px_rgba(0,0,0,0.5)]">
            {settings.brand.tagline}
          </div>
        </div>

        {/* Gold line */}
        <div className="w-[60px] h-px bg-brand-accent-light opacity-70 mx-auto mb-5" />

        <div className="text-[0.75rem] tracking-[0.55em] text-brand-accent-light uppercase mb-5 pr-[0.55em] [text-shadow:0_2px_8px_rgba(0,0,0,0.6)]">
          {hero.eyebrow}
        </div>

        {/* Eyebrow → title spacing */}
        <h1 className="font-body text-[clamp(1.6rem,3.2vw,2.4rem)] font-light leading-snug tracking-wide mb-5 text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.6)]">
          {hero.titleBefore}
          <span className="text-brand-accent-light">{hero.titleAccent}</span>
        </h1>

        <p className="text-[0.95rem] text-white/90 max-w-[520px] mx-auto mb-9 leading-relaxed font-light [text-shadow:0_2px_8px_rgba(0,0,0,0.5)]">
          {hero.subtitle}
        </p>

        <Link
          href={hero.ctaHref}
          className="inline-block px-10 py-4 bg-white text-brand-primary text-[0.76rem] tracking-[0.2em] uppercase font-medium border border-white hover:bg-transparent hover:text-white transition-colors duration-300 no-underline"
        >
          {hero.ctaText}
        </Link>
      </div>
    </section>
  );
}
