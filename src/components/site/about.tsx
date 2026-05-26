import Link from "next/link";
import Image from "next/image";
import { sections } from "@/lib/data/content";
import { siteConfig } from "@/lib/site-config";

export function About() {
  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="py-20 lg:py-24 px-6 lg:px-10 bg-brand-bg"
    >
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div>
          <span className="text-[0.72rem] tracking-[0.4em] uppercase text-brand-accent mb-3 inline-block">
            {sections.about.eyebrow}
          </span>
          <h2
            id="about-title"
            className="font-body text-[clamp(1.8rem,3.5vw,3rem)] font-light leading-tight mb-6 text-brand-primary tracking-wide"
          >
            {sections.about.titleLine1}
            <span className="text-brand-accent">{sections.about.titleAccent}</span>
            <br />
            {sections.about.titleLine2}
          </h2>
          {sections.about.paragraphs.map((p, i) => (
            <p
              key={i}
              className="text-[0.98rem] text-brand-text leading-loose font-light mb-5"
            >
              {p}
            </p>
          ))}
          <Link
            href={sections.about.ctaHref}
            className="inline-block px-10 py-4 mt-3 bg-brand-primary text-white text-[0.76rem] tracking-[0.2em] uppercase font-medium border border-brand-primary hover:bg-transparent hover:text-brand-primary transition-colors duration-300 no-underline"
          >
            {sections.about.ctaText}
          </Link>
        </div>

        <div className="relative aspect-[4/5] lg:aspect-[3/4] overflow-hidden">
          <Image
            src={sections.about.image}
            alt={`${siteConfig.name} — ${sections.about.eyebrow}`}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
