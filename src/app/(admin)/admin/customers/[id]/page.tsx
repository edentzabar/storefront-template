import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { ChevronRight, Mail, Phone, ShieldCheck, ShieldOff, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { computeSegments } from "@/lib/admin/customer-segments";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { RoleSelector } from "./_components/role-selector";
import { CustomerTimeline } from "./_components/customer-timeline";
import { ManualTags } from "./_components/manual-tags";
import { InternalNotes } from "./_components/internal-notes";
import { SegmentInfo } from "@/components/admin/segment-info";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "פרטי לקוח",
  robots: { index: false, follow: false },
};

type Params = { params: Promise<{ id: string }> };

export default async function CustomerDetailPage({ params }: Params) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { items: true } } },
      },
    },
  });
  if (!user) notFound();

  const activeOrders = user.orders.filter((o) => o.status !== "cancelled");
  const totalSpent = activeOrders.reduce((s, o) => s + o.total, 0);
  const aov = activeOrders.length ? totalSpent / activeOrders.length : 0;
  const lastOrder = user.orders[0] ?? null;

  const segments = computeSegments({
    role: user.role,
    totalSpent,
    totalOrders: activeOrders.length,
    createdAt: user.createdAt,
    lastOrderAt: lastOrder?.createdAt ?? null,
  });

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const timelineOrders = user.orders.map((o) => ({
    id: o.id,
    total: o.total,
    status: o.status,
    createdAt: o.createdAt,
    itemsCount: o._count.items,
  }));

  const manualTags = ((user.tags as unknown as string[]) ?? []).filter(Boolean);

  return (
    <div className="p-4 md:p-8 max-w-[1600px]">
      {/* Back */}
      <div className="mb-3">
        <Link
          href="/admin/customers"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 no-underline"
        >
          <ChevronRight className="size-3.5 rotate-180" />
          חזרה לרשימת לקוחות
        </Link>
      </div>

      {/* Profile header */}
      <div className="bg-card border border-border rounded-lg p-5 md:p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-5 md:items-start">
          <Avatar className="size-16 md:size-20">
            <AvatarFallback className="bg-brand-gradient text-white text-xl font-semibold tracking-wide">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-medium tracking-tight text-foreground">{user.name}</h1>
              {segments.map((s) => (
                <Badge
                  key={s.key}
                  className={cn("text-[10px] font-medium border", s.tone)}
                  variant="outline"
                >
                  {s.label}
                </Badge>
              ))}
              {manualTags.map((t) => (
                <Badge
                  key={t}
                  variant="outline"
                  className="text-[10px] font-medium border border-brand-accent/30 bg-brand-bg-soft dark:bg-muted text-foreground"
                >
                  {t}
                </Badge>
              ))}
              <SegmentInfo />
            </div>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
              <a
                href={`mailto:${user.email}`}
                className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors no-underline"
              >
                <Mail className="size-3.5" />
                {user.email}
              </a>
              {user.phone && (
                <a
                  href={`tel:${user.phone}`}
                  className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors no-underline"
                >
                  <Phone className="size-3.5" />
                  {user.phone}
                </a>
              )}
              <span className="inline-flex items-center gap-1.5">
                {user.emailVerified ? (
                  <>
                    <ShieldCheck className="size-3.5 text-emerald-600" />
                    אימייל מאומת
                  </>
                ) : (
                  <>
                    <ShieldOff className="size-3.5 text-amber-600" />
                    אימייל לא מאומת
                  </>
                )}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              נרשם ב-{format(user.createdAt, "d MMMM yyyy", { locale: he })}
            </div>
          </div>
          <div className="flex gap-2 self-stretch md:self-start">
            <a
              href={`mailto:${user.email}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "no-underline")}
            >
              <Mail className="size-3.5" />
              <span className="hidden sm:inline">שלח מייל</span>
            </a>
            {user.phone && (
              <a
                href={`tel:${user.phone}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "no-underline")}
              >
                <Phone className="size-3.5" />
                <span className="hidden sm:inline">חייג</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatTile label="הזמנות פעילות" value={activeOrders.length.toLocaleString("he-IL")} />
        <StatTile
          label="ערך לקוח כולל (LTV)"
          value={`₪${Math.round(totalSpent).toLocaleString("he-IL")}`}
          accent
        />
        <StatTile
          label="הזמנה ממוצעת"
          value={`₪${Math.round(aov).toLocaleString("he-IL")}`}
        />
        <StatTile
          label="הזמנה אחרונה"
          value={
            lastOrder
              ? format(lastOrder.createdAt, "d MMM yyyy", { locale: he })
              : "—"
          }
        />
      </div>

      {/* Body: timeline + side panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="bg-card border border-border rounded-lg p-5 md:p-6">
          <h2 className="text-sm font-medium text-foreground mb-5">פעילות</h2>
          {user.orders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">
              אין עדיין פעילות.
            </p>
          ) : (
            <CustomerTimeline createdAt={user.createdAt} orders={timelineOrders} />
          )}
        </div>

        <aside className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-5">
            <h2 className="text-sm font-medium text-foreground mb-3">תיוגים ידניים</h2>
            <ManualTags userId={user.id} initialTags={manualTags} />
            <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
              תיוגים אלה הם בנוסף לתיוגים האוטומטיים (VIP / חוזר / חדש וכו&apos;).
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-5">
            <h2 className="text-sm font-medium text-foreground mb-3">הערות פנימיות</h2>
            <InternalNotes userId={user.id} initialNotes={user.internalNotes} />
          </div>

          <div className="bg-card border border-border rounded-lg p-5">
            <h2 className="text-sm font-medium text-foreground mb-3">תפקיד</h2>
            <RoleSelector userId={user.id} currentRole={user.role} />
          </div>

          <div className="bg-card border border-border rounded-lg p-5">
            <h2 className="text-sm font-medium text-foreground mb-3">פעולות מהירות</h2>
            <div className="space-y-1.5 text-sm">
              <Link
                href={`/admin/orders?q=${encodeURIComponent(user.email)}`}
                className="flex items-center justify-between p-2 -mx-2 rounded-md hover:bg-muted no-underline text-foreground"
              >
                <span>סנן הזמנות של הלקוח</span>
                <ExternalLink className="size-3.5 text-muted-foreground" />
              </Link>
              <a
                href={`mailto:${user.email}?subject=${encodeURIComponent(siteConfig.name)}`}
                className="flex items-center justify-between p-2 -mx-2 rounded-md hover:bg-muted no-underline text-foreground"
              >
                <span>שלח אימייל</span>
                <Mail className="size-3.5 text-muted-foreground" />
              </a>
              {user.phone && (
                <a
                  href={`tel:${user.phone}`}
                  className="flex items-center justify-between p-2 -mx-2 rounded-md hover:bg-muted no-underline text-foreground"
                >
                  <span>חייג</span>
                  <Phone className="size-3.5 text-muted-foreground" />
                </a>
              )}
            </div>
          </div>
        </aside>
      </div>
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
          accent ? "text-brand-gradient" : "text-foreground",
        )}
      >
        {value}
      </div>
    </div>
  );
}
