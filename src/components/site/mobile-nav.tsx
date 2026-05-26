"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, ExternalLink, MessageCircle, Phone, Mail } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { EditableSettings } from "@/lib/site-settings";
import { navItems } from "@/lib/data/content";

/**
 * Hamburger button + slide-in drawer for mobile. Categories, contact links,
 * legal pages. Auto-closes on link click via the onItemClick callback.
 */
export function MobileNav({ settings }: { settings: EditableSettings }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            className="lg:hidden rounded-md text-brand-text hover:text-brand-accent hover:bg-brand-bg-soft"
            aria-label="פתח תפריט"
          />
        }
      >
        <Menu className="size-5" strokeWidth={1.5} />
      </SheetTrigger>
      <SheetContent
        side="right"
        className="p-0 w-[300px] sm:w-[340px] bg-brand-bg flex flex-col [&>button]:hidden"
      >
        <SheetTitle className="sr-only">תפריט ניווט</SheetTitle>

        {/* Header */}
        <div className="px-5 py-4 border-b border-brand-border flex items-center justify-between">
          <div>
            <div className="font-display text-lg tracking-[0.2em] text-brand-primary">
              {settings.brand.name}
            </div>
            <div className="text-[0.55rem] tracking-[0.3em] uppercase text-brand-text-soft mt-0.5">
              {settings.brand.tagline}
            </div>
          </div>
          <button
            onClick={close}
            className="size-9 grid place-items-center rounded-md text-brand-text-soft hover:text-brand-primary hover:bg-brand-bg-soft transition-colors"
            aria-label="סגור"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          <ul className="space-y-0 list-none">
            {navItems.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  onClick={close}
                  className="block px-5 py-3 text-[0.95rem] text-brand-text hover:bg-brand-bg-soft hover:text-brand-accent transition-colors no-underline border-b border-brand-border/50"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Account / wishlist / cart secondary section */}
          <div className="mt-2 border-t border-brand-border">
            <h3 className="px-5 pt-4 pb-2 text-[0.65rem] tracking-[0.25em] uppercase text-brand-text-soft">
              חשבון
            </h3>
            <ul className="list-none">
              <SubLink href="/account" onClick={close}>
                החשבון שלי
              </SubLink>
              <SubLink href="/wishlist" onClick={close}>
                מועדפים
              </SubLink>
              <SubLink href="/contact" onClick={close}>
                צור קשר
              </SubLink>
            </ul>
          </div>
        </nav>

        {/* Contact footer */}
        <div className="border-t border-brand-border px-5 py-4 space-y-2.5">
          <a
            href={`tel:${settings.contact.phoneIntl}`}
            className="flex items-center gap-2.5 text-sm text-brand-text hover:text-brand-accent transition-colors no-underline"
          >
            <Phone className="size-3.5 text-brand-accent" strokeWidth={1.75} />
            {settings.contact.phone}
          </a>
          <a
            href={`mailto:${settings.contact.email}`}
            className="flex items-center gap-2.5 text-sm text-brand-text hover:text-brand-accent transition-colors no-underline break-all"
          >
            <Mail className="size-3.5 text-brand-accent" strokeWidth={1.75} />
            {settings.contact.email}
          </a>
          {settings.contact.whatsapp && (
            <a
              href={settings.contact.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-sm text-brand-text hover:text-brand-accent transition-colors no-underline"
            >
              <MessageCircle className="size-3.5 text-brand-accent" strokeWidth={1.75} />
              WhatsApp
              <ExternalLink className="size-3 opacity-60" />
            </a>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SubLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        className="block px-5 py-2.5 text-sm text-brand-text-soft hover:text-brand-accent hover:bg-brand-bg-soft transition-colors no-underline"
      >
        {children}
      </Link>
    </li>
  );
}
