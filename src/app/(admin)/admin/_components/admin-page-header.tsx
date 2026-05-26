import Link from "next/link";

type Props = {
  title: string;
  subtitle?: string;
  action?: { label: string; href: string };
};

export function AdminPageHeader({ title, subtitle, action }: Props) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 mb-6 md:mb-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center px-4 py-2.5 bg-foreground text-background text-[0.78rem] tracking-[0.15em] uppercase font-medium hover:bg-foreground/90 transition-colors no-underline rounded-md"
        >
          {action.label}
        </Link>
      )}
    </header>
  );
}
