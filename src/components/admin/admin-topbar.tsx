"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
  ExternalLink,
  LogOut,
  Menu,
  PanelRightClose,
  PanelRightOpen,
  User,
  UserCircle2,
} from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from "./theme-toggle";
import { CommandPalette } from "./command-palette";
import { NotificationsBell, type AdminNotification } from "./notifications-bell";
import { AdminSidebar } from "./admin-sidebar";
import { useAdminUI } from "@/lib/stores/admin-ui-store";

export function AdminTopbar({
  userName,
  userEmail,
  notifications,
  pendingOrders,
}: {
  userName: string;
  userEmail: string;
  notifications: AdminNotification[];
  pendingOrders: number;
}) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarCollapsed = useAdminUI((s) => s.sidebarCollapsed);
  const toggleSidebar = useAdminUI((s) => s.toggleSidebar);

  async function handleLogout() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 flex items-center gap-2 px-3 md:px-6 shrink-0">
      {/* Mobile menu */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon-lg"
              className="md:hidden rounded-md text-muted-foreground"
              aria-label="פתח תפריט"
            />
          }
        >
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent side="right" className="p-0 w-72 [&>button]:hidden">
          <SheetTitle className="sr-only">תפריט ניהול</SheetTitle>
          <AdminSidebar
            mobile
            pendingOrders={pendingOrders}
            onItemClick={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar toggle — always visible at the start of the topbar */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-lg"
              onClick={toggleSidebar}
              className="hidden md:inline-flex rounded-md text-muted-foreground hover:text-foreground"
              aria-label={sidebarCollapsed ? "פתח סרגל" : "כווץ סרגל"}
            />
          }
        >
          {sidebarCollapsed ? (
            <PanelRightOpen className="size-4" />
          ) : (
            <PanelRightClose className="size-4" />
          )}
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {sidebarCollapsed ? "פתח סרגל" : "כווץ סרגל"}
        </TooltipContent>
      </Tooltip>

      {/* Search / Command palette trigger */}
      <div className="flex-1 max-w-2xl">
        <CommandPalette />
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-1 mr-auto">
        <Link
          href="/"
          target="_blank"
          className="hidden md:inline-flex h-9 px-3 items-center gap-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted no-underline transition-colors"
        >
          <ExternalLink className="size-4" />
          צפייה באתר
        </Link>
        <NotificationsBell items={notifications} />
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="lg"
                className="gap-2 px-2 rounded-md hover:bg-muted"
                aria-label="תפריט משתמש"
              />
            }
          >
            <Avatar className="size-7">
              <AvatarFallback className="text-[11px] font-medium bg-brand-accent text-white">
                {initials || <UserCircle2 className="size-4" />}
              </AvatarFallback>
            </Avatar>
            <span className="hidden md:inline text-sm">{userName}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="font-medium text-sm">{userName}</div>
              <div className="text-xs text-muted-foreground truncate">{userEmail}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/account")}>
              <User className="size-4" />
              החשבון שלי
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open("/", "_blank")}>
              <ExternalLink className="size-4" />
              פתח את האתר
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} variant="destructive">
              <LogOut className="size-4" />
              התנתק
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
