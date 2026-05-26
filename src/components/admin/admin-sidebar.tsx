"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FolderTree,
  Settings,
  Sparkles,
  Ticket,
  BarChart3,
  ShoppingBasket,
  MessageSquare,
  Upload,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAdminUI } from "@/lib/stores/admin-ui-store";

type NavItem = { href: string; label: string; icon: LucideIcon; badge?: number };

export function AdminSidebar({
  pendingOrders = 0,
  onItemClick,
  mobile = false,
}: {
  pendingOrders?: number;
  onItemClick?: () => void;
  mobile?: boolean;
}) {
  const pathname = usePathname();
  const collapsed = useAdminUI((s) => s.sidebarCollapsed);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const nav: NavItem[] = [
    { href: "/admin", label: "דשבורד", icon: LayoutDashboard },
    {
      href: "/admin/orders",
      label: "הזמנות",
      icon: ShoppingCart,
      badge: pendingOrders || undefined,
    },
    { href: "/admin/products", label: "מוצרים", icon: Package },
    { href: "/admin/import", label: "ייבוא מוצרים", icon: Upload },
    { href: "/admin/categories", label: "קטגוריות", icon: FolderTree },
    { href: "/admin/customers", label: "לקוחות", icon: Users },
    { href: "/admin/abandoned-carts", label: "עגלות נטושות", icon: ShoppingBasket },
    { href: "/admin/coupons", label: "קופונים", icon: Ticket },
    { href: "/admin/popups", label: "פופאפים", icon: MessageSquare },
    { href: "/admin/reports", label: "דוחות", icon: BarChart3 },
    { href: "/admin/settings", label: "הגדרות", icon: Settings },
  ];

  const isCollapsed = mounted && collapsed && !mobile;

  return (
    <aside
      className={cn(
        "shrink-0 bg-sidebar text-sidebar-foreground border-l border-sidebar-border flex flex-col transition-[width] duration-200",
        mobile ? "w-full h-full border-l-0" : isCollapsed ? "w-[68px]" : "w-[244px]",
      )}
    >
      {/* Brand row */}
      <div
        className={cn(
          "h-16 flex items-center border-b border-sidebar-border shrink-0",
          isCollapsed ? "justify-center px-2" : "justify-start px-5",
        )}
      >
        <Link
          href="/admin"
          className="flex items-center gap-2 no-underline"
          aria-label={`${siteConfig.name} Admin`}
        >
          <div className="size-8 grid place-items-center bg-brand-gradient rounded-sm shrink-0">
            <Sparkles className="size-4 text-white" strokeWidth={2.5} />
          </div>
          {!isCollapsed && (
            <div>
              <div className="font-sans text-base font-semibold tracking-[0.18em] text-sidebar-foreground leading-none uppercase">
                {siteConfig.name}
              </div>
              <div className="text-[0.55rem] tracking-[0.3em] uppercase text-muted-foreground leading-none mt-1">
                Admin
              </div>
            </div>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        <ul className={cn("space-y-0.5", isCollapsed ? "px-2" : "px-3")}>
          {nav.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            const linkEl = (
              <Link
                href={item.href}
                onClick={onItemClick}
                className={cn(
                  "flex items-center gap-3 rounded-md text-sm transition-colors no-underline relative",
                  isCollapsed ? "justify-center h-10 w-10 mx-auto" : "px-3 h-10",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60",
                )}
              >
                <Icon className="size-4 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge ? (
                      <span className="text-[10px] font-medium tabular-nums bg-brand-accent text-white rounded-full px-1.5 min-w-[20px] h-5 grid place-items-center">
                        {item.badge}
                      </span>
                    ) : null}
                  </>
                )}
                {isCollapsed && item.badge ? (
                  <span className="absolute -top-1 -left-1 text-[10px] font-medium tabular-nums bg-brand-accent text-white rounded-full px-1 min-w-[18px] h-[18px] grid place-items-center">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
            return (
              <li key={item.href}>
                {isCollapsed ? (
                  <Tooltip>
                    <TooltipTrigger render={linkEl} />
                    <TooltipContent side="left">{item.label}</TooltipContent>
                  </Tooltip>
                ) : (
                  linkEl
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
