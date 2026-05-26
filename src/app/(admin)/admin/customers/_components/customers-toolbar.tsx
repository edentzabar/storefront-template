"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const SEGMENTS = [
  { value: "all", label: "הכל" },
  { value: "vip", label: "VIP" },
  { value: "returning", label: "חוזרים" },
  { value: "new", label: "חדשים" },
  { value: "at-risk", label: "בסיכון" },
  { value: "admin", label: "מנהלים" },
];

export function CustomersToolbar({
  counts,
}: {
  counts: Record<string, number>;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const activeSegment = params.get("segment") ?? "all";
  const [search, setSearch] = useState(params.get("q") ?? "");

  useEffect(() => {
    setSearch(params.get("q") ?? "");
  }, [params]);

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "" || v === "all") next.delete(k);
      else next.set(k, v);
    }
    startTransition(() => router.push(`?${next.toString()}`));
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    update({ q: search });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {SEGMENTS.map((s) => {
          const active = activeSegment === s.value;
          const count = counts[s.value] ?? 0;
          return (
            <Link
              key={s.value}
              href={`?${(() => {
                const p = new URLSearchParams(params);
                if (s.value === "all") p.delete("segment");
                else p.set("segment", s.value);
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
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש לפי שם, מייל, או טלפון"
          className="h-9 pr-9 pl-8"
        />
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              update({ q: null });
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 size-5 grid place-items-center text-muted-foreground hover:text-foreground"
            aria-label="נקה חיפוש"
          >
            <X className="size-3.5" />
          </button>
        )}
      </form>
      {pending && <div className="text-[11px] text-muted-foreground">טוען...</div>}
    </div>
  );
}
