import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { footer } from "@/lib/data/content";

export async function Footer() {
  return (
    <footer
      role="contentinfo"
      className="bg-brand-primary text-white/85 pt-16 pb-8 px-6 lg:px-10"
    >
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          <div className="md:col-span-2 lg:col-span-1">
            <Logo size="md" />
            <p className="mt-5 text-[0.92rem] leading-relaxed font-light text-white/75 max-w-sm">
              {footer.brandDescription}
            </p>
          </div>

          {footer.columns.map((col) => (
            <div key={col.title}>
              <h5 className="text-[0.78rem] tracking-[0.3em] uppercase text-white mb-5 font-medium">
                {col.title}
              </h5>
              <ul className="space-y-3 list-none">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[0.92rem] text-white/75 hover:text-brand-accent-light transition-colors no-underline font-light"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 text-center text-[0.78rem] text-white/55 tracking-wider">
          {footer.copyright()}
        </div>
      </div>
    </footer>
  );
}
