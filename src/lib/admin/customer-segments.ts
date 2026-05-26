import { differenceInDays } from "date-fns";

export type CustomerSegment =
  | { key: "vip"; label: "VIP"; tone: string }
  | { key: "admin"; label: "מנהל"; tone: string }
  | { key: "new"; label: "חדש"; tone: string }
  | { key: "returning"; label: "חוזר"; tone: string }
  | { key: "at-risk"; label: "בסיכון"; tone: string }
  | { key: "lapsed"; label: "נטוש"; tone: string };

const TONES = {
  gold: "bg-brand-gradient text-white border-transparent",
  emerald:
    "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900",
  blue: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900",
  amber:
    "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900",
  rose: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900",
  slate: "bg-muted text-muted-foreground border-border",
};

const VIP_THRESHOLD = 5000;
const NEW_DAYS = 14;
const AT_RISK_DAYS = 60;
const LAPSED_DAYS = 180;

export function computeSegments(input: {
  role: "customer" | "admin";
  totalSpent: number;
  totalOrders: number;
  createdAt: Date;
  lastOrderAt: Date | null;
}): CustomerSegment[] {
  const segments: CustomerSegment[] = [];

  if (input.role === "admin") {
    segments.push({ key: "admin", label: "מנהל", tone: TONES.slate });
  }

  if (input.totalSpent >= VIP_THRESHOLD) {
    segments.push({ key: "vip", label: "VIP", tone: TONES.gold });
  }

  if (input.totalOrders >= 2) {
    segments.push({ key: "returning", label: "חוזר", tone: TONES.emerald });
  }

  const ageDays = differenceInDays(new Date(), input.createdAt);
  if (ageDays <= NEW_DAYS) {
    segments.push({ key: "new", label: "חדש", tone: TONES.blue });
  }

  if (input.lastOrderAt) {
    const sinceLast = differenceInDays(new Date(), input.lastOrderAt);
    if (sinceLast >= LAPSED_DAYS) {
      segments.push({ key: "lapsed", label: "נטוש", tone: TONES.rose });
    } else if (sinceLast >= AT_RISK_DAYS && input.totalOrders >= 1) {
      segments.push({ key: "at-risk", label: "בסיכון", tone: TONES.amber });
    }
  }

  return segments;
}
