type Props = {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
  className?: string;
};

export function SectionHeader({ eyebrow, title, subtitle, className = "" }: Props) {
  return (
    <header className={`text-center max-w-[640px] mx-auto mb-12 ${className}`}>
      <div className="text-[0.72rem] tracking-[0.4em] uppercase text-brand-accent mb-3">
        {eyebrow}
      </div>
      <h2 className="font-body text-[clamp(1.8rem,3.5vw,2.8rem)] font-light leading-tight mb-4 text-brand-primary tracking-wide">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[0.95rem] text-brand-text-soft leading-relaxed font-light">
          {subtitle}
        </p>
      )}
    </header>
  );
}
