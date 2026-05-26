"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WINDOWS = [
  { value: 7, label: "7 ימים" },
  { value: 30, label: "30 ימים" },
  { value: 90, label: "90 ימים" },
] as const;

export function DashboardRange({
  activeWindow,
  activeFrom,
  activeTo,
}: {
  activeWindow: number | null;
  activeFrom: string | null;
  activeTo: string | null;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [from, setFrom] = useState(activeFrom ?? "");
  const [to, setTo] = useState(activeTo ?? format(new Date(), "yyyy-MM-dd"));

  const isCustom = Boolean(activeFrom && activeTo);

  function setWindow(days: number) {
    const next = new URLSearchParams(params);
    next.set("window", String(days));
    next.delete("from");
    next.delete("to");
    startTransition(() => router.push(`?${next.toString()}`));
  }

  function applyCustom() {
    if (!from || !to) return;
    const next = new URLSearchParams(params);
    next.delete("window");
    next.set("from", from);
    next.set("to", to);
    startTransition(() => router.push(`?${next.toString()}`));
  }

  return (
    <div className="inline-flex bg-muted rounded-md p-0.5">
      {WINDOWS.map((w) => (
        <button
          key={w.value}
          onClick={() => setWindow(w.value)}
          disabled={pending}
          className={cn(
            "px-3 py-1.5 text-xs rounded-sm transition-colors",
            activeWindow === w.value && !isCustom
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {w.label}
        </button>
      ))}
      <Popover>
        <PopoverTrigger
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-sm transition-colors",
            isCustom
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Calendar className="size-3.5" />
          {isCustom
            ? `${format(new Date(activeFrom!), "d MMM")} – ${format(new Date(activeTo!), "d MMM")}`
            : "מותאם"}
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[280px] p-4">
          <div className="space-y-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-1.5">
                מתאריך
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                max={to}
                className="w-full px-3 py-1.5 border border-border rounded-md text-sm bg-background"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-1.5">
                עד תאריך
              </label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                min={from}
                max={format(new Date(), "yyyy-MM-dd")}
                className="w-full px-3 py-1.5 border border-border rounded-md text-sm bg-background"
              />
            </div>
            <Button
              type="button"
              onClick={applyCustom}
              disabled={!from || !to || pending}
              className="w-full bg-foreground text-background hover:bg-foreground/90"
              size="sm"
            >
              {pending ? "טוען..." : "החל"}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
