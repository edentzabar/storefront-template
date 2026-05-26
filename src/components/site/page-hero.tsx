type Props = {
  title: string;
  eyebrow?: string;
  subtitle?: string;
};

export function PageHero({ title, eyebrow, subtitle }: Props) {
  return (
    <header className="py-16 lg:py-20 px-6 lg:px-10 bg-brand-bg text-center border-b border-brand-border">
      {eyebrow && (
        <div className="text-[0.78rem] tracking-[0.4em] uppercase text-brand-accent mb-3">
          {eyebrow}
        </div>
      )}
      <h1 className="font-body text-[clamp(2rem,4vw,3rem)] font-light text-brand-primary tracking-wide">
        {title}
      </h1>
      {subtitle && (
        <p className="max-w-[640px] mx-auto mt-5 text-brand-text-soft font-light leading-relaxed">
          {subtitle}
        </p>
      )}
    </header>
  );
}
