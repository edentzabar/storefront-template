import Link from "next/link";

type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="bg-brand-surface border-b border-brand-border py-4 text-sm" aria-label="ניווט פירורי לחם">
      <ol className="max-w-[1400px] mx-auto px-6 lg:px-10 flex flex-wrap items-center gap-2 list-none">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-2 text-brand-text-soft">
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-brand-accent transition-colors no-underline">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-brand-primary font-medium" : ""} aria-current={isLast ? "page" : undefined}>
                  {item.label}
                </span>
              )}
              {!isLast && <span className="text-brand-border">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
