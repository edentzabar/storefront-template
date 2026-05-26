import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  delta: number;
  icon: LucideIcon;
  /** Smaller text/value layout for compact cards */
  compact?: boolean;
  /** A short label for the comparison period (e.g. "מאתמול") */
  comparison?: string;
  /** Optional inline sparkline component */
  sparkline?: React.ReactNode;
};

export function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  compact = false,
  comparison = "מהתקופה הקודמת",
  sparkline,
}: Props) {
  const positive = delta > 0.5;
  const negative = delta < -0.5;
  const Arrow = positive ? ArrowUpRight : negative ? ArrowDownRight : Minus;

  return (
    <div className="group relative overflow-hidden bg-card border border-border rounded-lg p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
          <div
            className={cn(
              "font-semibold text-foreground mt-2 tabular-nums tracking-tight",
              compact ? "text-2xl" : "text-3xl",
            )}
          >
            {value}
          </div>
        </div>
        <div className="size-9 rounded-md bg-brand-bg-soft dark:bg-muted grid place-items-center shrink-0">
          <Icon className="size-4 text-brand-accent" strokeWidth={2} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium tabular-nums",
            positive && "text-emerald-600 dark:text-emerald-400",
            negative && "text-rose-600 dark:text-rose-400",
            !positive && !negative && "text-muted-foreground",
          )}
        >
          <Arrow className="size-3.5" />
          {Math.abs(delta).toFixed(1)}%
          <span className="text-muted-foreground font-normal mr-1">{comparison}</span>
        </div>
        {sparkline && <div className="opacity-80">{sparkline}</div>}
      </div>
    </div>
  );
}
