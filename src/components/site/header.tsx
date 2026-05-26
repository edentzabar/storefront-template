import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { HeaderActions } from "@/components/site/header-actions";
import { MobileNav } from "@/components/site/mobile-nav";
import { getSiteSettings } from "@/lib/site-settings";
import { navItems } from "@/lib/data/content";

export async function Header() {
  const settings = await getSiteSettings();

  return (
    <header className="sticky top-0 z-50 bg-brand-bg/95 backdrop-blur border-b border-brand-border">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-4 px-3 sm:px-6 lg:px-10 py-3 max-w-[1400px] mx-auto">
        {/* RIGHT (start in RTL): mobile hamburger, desktop logo */}
        <div className="flex items-center">
          <MobileNav settings={settings} />
          <div className="hidden lg:block">
            <Logo />
          </div>
        </div>

        {/* CENTER: small logo on mobile, full nav on desktop */}
        <div className="flex items-center justify-center min-w-0">
          <div className="lg:hidden">
            <Logo size="sm" />
          </div>
          <nav aria-label="ניווט ראשי" className="hidden lg:block">
            <ul className="flex justify-center gap-7 list-none">
              {navItems.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="text-[0.82rem] tracking-[0.12em] font-normal text-brand-text hover:text-brand-accent transition-colors py-1.5 relative no-underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* LEFT (end in RTL): action icons */}
        <HeaderActions />
      </div>
    </header>
  );
}
