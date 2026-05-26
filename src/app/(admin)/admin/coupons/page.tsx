import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CouponsTable } from "./_components/coupons-table";

export const metadata: Metadata = {
  title: "ניהול קופונים",
  robots: { index: false, follow: false },
};

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="p-4 md:p-8 max-w-[1600px]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground">
            קופונים
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {coupons.length.toLocaleString("he-IL")} קופונים סך הכל
          </p>
        </div>
        <Link
          href="/admin/coupons/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background text-sm font-medium rounded-md hover:bg-foreground/90 transition-colors no-underline"
        >
          <Plus className="size-4" />
          קופון חדש
        </Link>
      </div>

      <CouponsTable coupons={coupons} />
    </div>
  );
}
