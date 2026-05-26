"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search, LayoutGrid, List, X } from "lucide-react";
import { OrderStatus } from "@prisma/client";
import { STATUS_LABELS } from "@/lib/admin/order-helpers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUSES: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "הכל" },
  { value: "new", label: STATUS_LABELS.new },
  { value: "processing", label: STATUS_LABELS.processing },
  { value: "shipped", label: STATUS_LABELS.shipped },
  { value: "delivered", label: STATUS_LABELS.delivered },
  { value: "cancelled", label: STATUS_LABELS.cancelled },
];

export function OrdersToolbar({
  counts,
}: {
  counts: Record<OrderStatus | "all", number>;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const activeStatus = (params.get("status") as OrderStatus | "all") ?? "all";
  const activeView = params.get("view") ?? "list";
  const activeSearch = params.get("q") ?? "";

  const [search, setSearch] = useState(activeSearch);

  // Sync search with URL when external changes happen
  useEffect(() => {
    setSearch(params.get("q") ?? "");
  }, [params]);

  function updateParams(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "" || v === "all") next.delete(k);
      else next.set(k, v);
    }
    startTransition(() => router.push(`?${next.toString()}`));
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ q: search });
  }

  return (
    <div className="space-y-3">
      {/* Status chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {STATUSES.map((s) => {
          const active = activeStatus === s.value;
          const count = counts[s.value] ?? 0;
          return (
            <Link
              key={s.value}
              href={`?${(() => {
                const p = new URLSearchParams(params);
                if (s.value === "all") p.delete("status");
                else p.set("status", s.value);
                return p.toString();
              })()}`}
              scroll={false}
              className={cn(
                "shrink-0 inline-flex items-center gap-2 px-3 h-8 rounded-full text-xs border transition-colors no-underline",
                active
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-muted-foreground border-border hover:text-foreground hover:border-foreground/30",
              )}
            >
              {s.label}
              <span
                className={cn(
                  "tabular-nums text-[10px] rounded-full px-1.5 min-w-[18px] text-center",
                  active ? "bg-background/20" : "bg-muted",
                )}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Search + view */}
      <div className="flex flex-col sm:flex-row gap-2">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש לפי שם לקוח, מייל, או מספר הזמנה"
            className="h-9 pr-9 pl-8"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                updateParams({ q: null });
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 size-5 grid place-items-center text-muted-foreground hover:text-foreground"
              aria-label="נקה חיפוש"
            >
              <X className="size-3.5" />
            </button>
          )}
        </form>
        <div className="inline-flex bg-muted rounded-md p-0.5 self-start sm:self-auto">
          <button
            onClick={() => updateParams({ view: null })}
            className={cn(
              "px-3 h-8 inline-flex items-center gap-1.5 rounded-sm text-xs transition-colors",
              activeView === "list"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <List className="size-3.5" />
            רשימה
          </button>
          <button
            onClick={() => updateParams({ view: "kanban" })}
            className={cn(
              "px-3 h-8 inline-flex items-center gap-1.5 rounded-sm text-xs transition-colors",
              activeView === "kanban"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LayoutGrid className="size-3.5" />
            Kanban
          </button>
        </div>
      </div>

      {pending && <div className="text-[11px] text-muted-foreground">טוען...</div>}
    </div>
  );
}
