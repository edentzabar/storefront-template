"use client";

import Link from "next/link";
import { Bell, ShoppingCart, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type AdminNotification = {
  id: string;
  type: "pending-order" | "low-stock" | "info";
  title: string;
  description: string;
  href?: string;
  time?: string;
};

export function NotificationsBell({ items }: { items: AdminNotification[] }) {
  const count = items.length;
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            className="rounded-md relative text-muted-foreground hover:text-foreground"
            aria-label={`התראות (${count})`}
          />
        }
      >
        <Bell className="size-4" />
        {count > 0 && (
          <span className="absolute -top-0.5 -left-0.5 size-4 grid place-items-center rounded-full bg-brand-accent text-white text-[10px] font-semibold">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="text-sm font-medium">התראות</div>
          <div className="text-[11px] text-muted-foreground">{count} ממתינות</div>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
              <CheckCircle2 className="size-8 text-brand-accent/50" strokeWidth={1.5} />
              הכל מסודר. אין התראות חדשות.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((n) => {
                const Icon =
                  n.type === "pending-order"
                    ? ShoppingCart
                    : n.type === "low-stock"
                      ? AlertTriangle
                      : Bell;
                const tone =
                  n.type === "low-stock"
                    ? "text-amber-600 bg-amber-50 dark:bg-amber-950/40"
                    : "text-brand-accent bg-brand-bg-soft dark:bg-muted";
                const body = (
                  <div className="px-4 py-3 flex gap-3 hover:bg-muted/50 transition-colors">
                    <div className={`size-9 rounded-md grid place-items-center shrink-0 ${tone}`}>
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium leading-tight">{n.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">
                        {n.description}
                      </div>
                      {n.time && (
                        <div className="text-[10px] text-muted-foreground/70 mt-1">{n.time}</div>
                      )}
                    </div>
                  </div>
                );
                return (
                  <li key={n.id}>
                    {n.href ? (
                      <Link href={n.href} className="block no-underline text-foreground">
                        {body}
                      </Link>
                    ) : (
                      body
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {items.length > 0 && (
          <div className="border-t border-border px-4 py-2 text-center">
            <Link
              href="/admin/orders"
              className="text-xs text-muted-foreground hover:text-foreground no-underline"
            >
              צפה בכל ההזמנות
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
