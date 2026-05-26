"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Settings,
  ExternalLink,
  Plus,
  Search,
  LogOut,
  Sun,
  Moon,
  Home,
  Ticket,
  BarChart3,
  ShoppingBasket,
  MessageSquare,
  Upload,
} from "lucide-react";
import { useTheme } from "next-themes";
import { signOut } from "@/lib/auth-client";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  trigger?: "button" | "icon";
  className?: string;
};

export function CommandPalette({ trigger = "button", className }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  function run(fn: () => void | Promise<void>) {
    setOpen(false);
    fn();
  }

  return (
    <>
      {trigger === "button" ? (
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className={cn(
            "h-9 w-full md:w-72 justify-between gap-2 px-3 text-sm font-normal text-muted-foreground bg-background/50 hover:bg-background",
            className,
          )}
        >
          <span className="flex items-center gap-2">
            <Search className="size-4" />
            חיפוש או פעולה...
          </span>
          <kbd className="hidden md:inline-flex items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={() => setOpen(true)}
          className={cn("rounded-md text-muted-foreground hover:text-foreground", className)}
          aria-label="חיפוש"
        >
          <Search className="size-4" />
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="top-[20%] translate-y-0 max-w-lg p-0 overflow-hidden"
        >
          <DialogTitle className="sr-only">חיפוש ופעולות</DialogTitle>
          <DialogDescription className="sr-only">
            ניווט מהיר ופעולות מערכת
          </DialogDescription>
          <Command className="rounded-xl">
            <CommandInput placeholder="הקלד כדי לחפש או לבחור פעולה..." />
            <CommandList>
              <CommandEmpty>לא נמצאו תוצאות.</CommandEmpty>

              <CommandGroup heading="ניווט">
                <CommandItem onSelect={() => run(() => router.push("/admin"))}>
                  <LayoutDashboard className="size-4" />
                  <span>דשבורד</span>
                  <CommandShortcut>G D</CommandShortcut>
                </CommandItem>
                <CommandItem onSelect={() => run(() => router.push("/admin/orders"))}>
                  <ShoppingCart className="size-4" />
                  <span>הזמנות</span>
                  <CommandShortcut>G O</CommandShortcut>
                </CommandItem>
                <CommandItem onSelect={() => run(() => router.push("/admin/products"))}>
                  <Package className="size-4" />
                  <span>מוצרים</span>
                  <CommandShortcut>G P</CommandShortcut>
                </CommandItem>
                <CommandItem onSelect={() => run(() => router.push("/admin/import"))}>
                  <Upload className="size-4" />
                  <span>ייבוא מוצרים</span>
                </CommandItem>
                <CommandItem onSelect={() => run(() => router.push("/admin/categories"))}>
                  <FolderTree className="size-4" />
                  <span>קטגוריות</span>
                  <CommandShortcut>G C</CommandShortcut>
                </CommandItem>
                <CommandItem onSelect={() => run(() => router.push("/admin/customers"))}>
                  <Users className="size-4" />
                  <span>לקוחות</span>
                  <CommandShortcut>G U</CommandShortcut>
                </CommandItem>
                <CommandItem onSelect={() => run(() => router.push("/admin/abandoned-carts"))}>
                  <ShoppingBasket className="size-4" />
                  <span>עגלות נטושות</span>
                </CommandItem>
                <CommandItem onSelect={() => run(() => router.push("/admin/coupons"))}>
                  <Ticket className="size-4" />
                  <span>קופונים</span>
                </CommandItem>
                <CommandItem onSelect={() => run(() => router.push("/admin/popups"))}>
                  <MessageSquare className="size-4" />
                  <span>פופאפים</span>
                </CommandItem>
                <CommandItem onSelect={() => run(() => router.push("/admin/reports"))}>
                  <BarChart3 className="size-4" />
                  <span>דוחות</span>
                </CommandItem>
                <CommandItem onSelect={() => run(() => router.push("/admin/settings"))}>
                  <Settings className="size-4" />
                  <span>הגדרות</span>
                  <CommandShortcut>G S</CommandShortcut>
                </CommandItem>
              </CommandGroup>

              <CommandSeparator />

              <CommandGroup heading="פעולות מהירות">
                <CommandItem onSelect={() => run(() => router.push("/admin/products/new"))}>
                  <Plus className="size-4" />
                  <span>מוצר חדש</span>
                </CommandItem>
                <CommandItem onSelect={() => run(() => router.push("/admin/categories/new"))}>
                  <Plus className="size-4" />
                  <span>קטגוריה חדשה</span>
                </CommandItem>
                <CommandItem onSelect={() => run(() => router.push("/admin/coupons/new"))}>
                  <Plus className="size-4" />
                  <span>קופון חדש</span>
                </CommandItem>
                <CommandItem onSelect={() => run(() => router.push("/admin/popups/new"))}>
                  <Plus className="size-4" />
                  <span>פופאפ חדש</span>
                </CommandItem>
              </CommandGroup>

              <CommandSeparator />

              <CommandGroup heading="כללי">
                <CommandItem onSelect={() => run(() => { window.open("/", "_blank"); })}>
                  <ExternalLink className="size-4" />
                  <span>פתח את האתר בטאב חדש</span>
                </CommandItem>
                <CommandItem onSelect={() => run(() => router.push("/"))}>
                  <Home className="size-4" />
                  <span>חזור לאתר הראשי</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => run(() => setTheme(theme === "dark" ? "light" : "dark"))}
                >
                  {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                  <span>{theme === "dark" ? "מצב יום" : "מצב לילה"}</span>
                </CommandItem>
                <CommandItem
                  onSelect={() =>
                    run(async () => {
                      await signOut();
                      router.push("/");
                      router.refresh();
                    })
                  }
                >
                  <LogOut className="size-4" />
                  <span>התנתק</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
