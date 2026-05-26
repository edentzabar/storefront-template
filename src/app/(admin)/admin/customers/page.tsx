import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { computeSegments } from "@/lib/admin/customer-segments";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CustomersToolbar } from "./_components/customers-toolbar";
import { SegmentInfo } from "@/components/admin/segment-info";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "ניהול לקוחות",
  robots: { index: false, follow: false },
};

const SEGMENT_KEYS = ["vip", "returning", "new", "at-risk", "admin"] as const;
type SegmentKey = (typeof SEGMENT_KEYS)[number];

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ segment?: string; q?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const segmentFilter = SEGMENT_KEYS.includes(params.segment as SegmentKey)
    ? (params.segment as SegmentKey)
    : null;

  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
          ],
        }
      : undefined,
    include: {
      orders: {
        select: { id: true, total: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Enrich each user with stats and segments
  const enriched = users.map((u) => {
    const active = u.orders.filter((o) => o.status !== "cancelled");
    const totalSpent = active.reduce((s, o) => s + o.total, 0);
    const segments = computeSegments({
      role: u.role,
      totalSpent,
      totalOrders: active.length,
      createdAt: u.createdAt,
      lastOrderAt: u.orders[0]?.createdAt ?? null,
    });
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      createdAt: u.createdAt,
      totalOrders: active.length,
      totalSpent,
      segments,
    };
  });

  // counts BEFORE segment filter (so chip badges reflect totals)
  const counts: Record<string, number> = { all: enriched.length };
  for (const seg of SEGMENT_KEYS) counts[seg] = 0;
  for (const u of enriched) {
    for (const s of u.segments) counts[s.key] = (counts[s.key] ?? 0) + 1;
  }

  const filtered = segmentFilter
    ? enriched.filter((u) => u.segments.some((s) => s.key === segmentFilter))
    : enriched;

  return (
    <div className="p-4 md:p-8 max-w-[1600px]">
      <div className="mb-6 flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground">לקוחות</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {enriched.length.toLocaleString("he-IL")} משתמשים רשומים
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          הסבר תיוגים
          <SegmentInfo />
        </div>
      </div>

      <div className="mb-4">
        <CustomersToolbar counts={counts} />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-lg text-muted-foreground">
          לא נמצאו משתמשים התואמים.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-right font-medium">לקוח</th>
                <th className="px-4 py-3 text-right font-medium hidden md:table-cell">תיוגים</th>
                <th className="px-4 py-3 text-right font-medium hidden sm:table-cell">הזמנות</th>
                <th className="px-4 py-3 text-right font-medium">LTV</th>
                <th className="px-4 py-3 text-right font-medium hidden lg:table-cell">נרשם</th>
                <th className="w-8 px-2 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((u) => {
                const initials = u.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                return (
                  <tr
                    key={u.id}
                    className="group cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/customers/${u.id}`}
                        className="flex items-center gap-3 no-underline text-foreground"
                      >
                        <Avatar className="size-9">
                          <AvatarFallback className="bg-brand-bg-soft dark:bg-muted text-foreground text-[11px] font-medium">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate group-hover:text-brand-accent transition-colors">
                            {u.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {u.email}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {u.segments.length === 0 ? (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        ) : (
                          u.segments.map((s) => (
                            <Badge
                              key={s.key}
                              variant="outline"
                              className={cn("text-[10px] font-medium border", s.tone)}
                            >
                              {s.label}
                            </Badge>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell tabular-nums text-sm">
                      {u.totalOrders}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-base font-semibold tabular-nums">
                        ₪{u.totalSpent.toLocaleString("he-IL")}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm text-muted-foreground">
                      {format(u.createdAt, "d MMM yyyy", { locale: he })}
                    </td>
                    <td className="px-2 py-3 text-left">
                      <Link
                        href={`/admin/customers/${u.id}`}
                        className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground group-hover:text-foreground transition-colors"
                        aria-label="פתח פרופיל"
                      >
                        <ChevronLeft className="size-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
