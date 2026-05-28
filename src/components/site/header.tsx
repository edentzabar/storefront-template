import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { HeaderActions } from "@/components/site/header-actions";
import { MobileNav } from "@/components/site/mobile-nav";
import { getSiteSettings } from "@/lib/site-settings";
import { getCategoryTree } from "@/lib/queries";

/**
 * Fixed nav entries that bookend the dynamic category list. Edit these
 * to add / remove static links — categories themselves come from the DB
 * via getCategoryTree(), with hover-dropdown for parents-with-children.
 */
const FIXED_LEFT = [{ id: "all", label: "כל הקולקציה", href: "/shop" }] as const;
const FIXED_RIGHT = [{ id: "sale", label: "מבצעים", href: "/sale" }] as const;

export async function Header() {
  const [settings, tree] = await Promise.all([getSiteSettings(), getCategoryTree()]);

  return (
    <header className="sticky top-0 z-50 bg-brand-bg/95 backdrop-blur border-b border-brand-border">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-4 px-3 sm:px-6 lg:px-10 py-3 max-w-[1400px] mx-auto">
        {/* RIGHT (start in RTL): mobile hamburger, desktop logo */}
        <div className="flex items-center">
          <MobileNav settings={settings} categoryTree={tree} />
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
            <ul className="flex flex-nowrap justify-center items-center gap-4 xl:gap-5 list-none whitespace-nowrap">
              {FIXED_LEFT.map((item) => (
                <NavLink key={item.id} href={item.href} label={item.label} />
              ))}

              {tree.map((cat) =>
                cat.children.length > 0 ? (
                  // Parent with subcategories — hover-open dropdown
                  <li key={cat.id} className="group relative shrink-0">
                    <Link
                      href={`/category/${cat.slug}`}
                      className="whitespace-nowrap text-[0.78rem] xl:text-[0.82rem] tracking-[0.08em] font-normal text-brand-text hover:text-brand-accent transition-colors py-1.5 inline-flex items-center gap-1 no-underline"
                    >
                      {cat.name}
                      <svg
                        aria-hidden
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        className="opacity-60 transition-transform group-hover:rotate-180"
                      >
                        <path
                          d="M1 3 L5 7 L9 3"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          fill="none"
                        />
                      </svg>
                    </Link>
                    {/* invisible bridge so the dropdown stays open while
                        the cursor crosses the gap between trigger + panel */}
                    <div className="absolute right-0 left-0 top-full h-2" />
                    <div
                      className={[
                        "absolute top-full right-1/2 translate-x-1/2 mt-2 min-w-[220px]",
                        "bg-white border border-brand-border rounded-lg shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)]",
                        "py-2 opacity-0 invisible translate-y-1",
                        "group-hover:opacity-100 group-hover:visible group-hover:translate-y-0",
                        "transition-all duration-200",
                      ].join(" ")}
                    >
                      {cat.children.map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/category/${sub.slug}`}
                          className="block px-5 py-2.5 text-[0.85rem] text-brand-text hover:text-brand-accent hover:bg-brand-bg-soft transition-colors no-underline whitespace-nowrap"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  </li>
                ) : (
                  // Plain top-level category
                  <NavLink
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    label={cat.name}
                  />
                ),
              )}

              {FIXED_RIGHT.map((item) => (
                <NavLink key={item.id} href={item.href} label={item.label} />
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

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <li className="shrink-0">
      <Link
        href={href}
        className="whitespace-nowrap text-[0.78rem] xl:text-[0.82rem] tracking-[0.08em] font-normal text-brand-text hover:text-brand-accent transition-colors py-1.5 relative no-underline"
      >
        {label}
      </Link>
    </li>
  );
}
