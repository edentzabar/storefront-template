import Link from "next/link";
import Image from "next/image";
import { sections } from "@/lib/data/content";

export function CtaBanner() {
  return (
    <section
      aria-labelledby="cta-title"
      className="relative h-[60vh] min-h-[450px] max-h-[600px] flex items-center justify-center overflow-hidden"
    >
      <Image
        src="/brand/hero.jpg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-[center_30%]"
      />
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 max-w-[720px] px-8 text-center text-white">
        <div className="text-[0.75rem] tracking-[0.45em] uppercase text-brand-accent-light mb-4">
          {sections.cta.eyebrow}
        </div>
        <h2
          id="cta-title"
          className="font-body text-[clamp(1.8rem,3.5vw,2.8rem)] font-light leading-tight tracking-wide mb-5"
        >
          {sections.cta.titleLine1}
          <span className="text-brand-accent-light">{sections.cta.titleAccent}</span>
          <br />
          {sections.cta.titleLine2}
        </h2>
        <p className="text-[0.98rem] text-white/90 mb-9 leading-relaxed font-light max-w-[560px] mx-auto">
          {sections.cta.subtitle}
        </p>
        <Link
          href={sections.cta.ctaHref}
          className="inline-block px-10 py-4 bg-white text-brand-primary text-[0.76rem] tracking-[0.2em] uppercase font-medium border border-white hover:bg-transparent hover:text-white transition-colors duration-300 no-underline"
        >
          {sections.cta.ctaText}
        </Link>
      </div>
    </section>
  );
}
