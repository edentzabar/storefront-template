import type { Metadata } from "next";
import { format, formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { Clock, Mail, Check } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "עגלות נטושות",
  robots: { index: false, follow: false },
};

export default async function AbandonedCartsPage() {
  const carts = await prisma.abandonedCart.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  const totals = {
    total: carts.length,
    sent: carts.filter((c) => c.reminderSentAt).length,
    recovered: carts.filter((c) => c.recoveredAt).length,
    revenueLost: carts
      .filter((c) => !c.recoveredAt)
      .reduce((s, c) => s + c.subtotal, 0),
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px]">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground">
          עגלות נטושות
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          לקוחות שהתחילו checkout (הזינו אימייל) אבל לא סיימו. נשלח להם תזכורת
          אוטומטית שעה אחרי הנטישה.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatTile label="סך הכל עגלות" value={totals.total.toLocaleString("he-IL")} />
        <StatTile label="תזכורות נשלחו" value={totals.sent.toLocaleString("he-IL")} />
        <StatTile
          label="שוחזרו"
          value={totals.recovered.toLocaleString("he-IL")}
          accent
        />
        <StatTile
          label="הכנסה פוטנציאלית"
          value={`₪${totals.revenueLost.toLocaleString("he-IL")}`}
        />
      </div>

      {carts.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-lg text-muted-foreground">
          אין עדיין עגלות נטושות. (זה דבר טוב!)
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-right font-medium">לקוח</th>
                <th className="px-4 py-3 text-right font-medium hidden md:table-cell">פריטים</th>
                <th className="px-4 py-3 text-right font-medium">שווי</th>
                <th className="px-4 py-3 text-right font-medium hidden sm:table-cell">נטישה</th>
                <th className="px-4 py-3 text-right font-medium">סטטוס</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {carts.map((c) => {
                const itemsCount = Array.isArray(c.items)
                  ? (c.items as unknown[]).length
                  : 0;
                return (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 align-middle">
                      <div className="font-medium text-sm">
                        {c.customerName ?? c.email}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-[260px]">
                        {c.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle hidden md:table-cell text-sm text-muted-foreground tabular-nums">
                      {itemsCount}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span className="text-base font-semibold tabular-nums">
                        ₪{c.subtotal.toLocaleString("he-IL")}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-middle hidden sm:table-cell text-sm text-muted-foreground">
                      <div className="inline-flex items-center gap-1">
                        <Clock className="size-3" />
                        {formatDistanceToNow(c.updatedAt, {
                          addSuffix: true,
                          locale: he,
                        })}
                      </div>
                      <div className="text-[10px] mt-0.5">
                        {format(c.updatedAt, "d MMM HH:mm", { locale: he })}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <StatusBadge
                        recovered={!!c.recoveredAt}
                        reminderSent={!!c.reminderSentAt}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed">
        תזכורות נשלחות אוטומטית דרך Vercel Cron (כל שעה עגולה). כל עגלה מקבלת
        תזכורת אחת בלבד, בתוך 14 ימים מהנטישה. ההגדרה ב-
        <code className="bg-muted px-1 py-0.5 rounded text-[10px]">vercel.json</code>
        . הקישור במייל פותח את {siteConfig.url}/cart ומשחזר את הפריטים.
      </p>
    </div>
  );
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="text-[11px] text-muted-foreground uppercase tracking-wider">
        {label}
      </div>
      <div
        className={cn(
          "text-2xl mt-1.5 font-semibold tabular-nums tracking-tight",
          accent
            ? "text-brand-gradient"
            : "text-foreground",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function StatusBadge({
  recovered,
  reminderSent,
}: {
  recovered: boolean;
  reminderSent: boolean;
}) {
  if (recovered) {
    return (
      <Badge className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-0 gap-1">
        <Check className="size-3" />
        שוחזרה
      </Badge>
    );
  }
  if (reminderSent) {
    return (
      <Badge className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-0 gap-1">
        <Mail className="size-3" />
        תזכורת נשלחה
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[10px] text-muted-foreground">
      ממתינה
    </Badge>
  );
}
