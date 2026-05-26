import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CouponForm } from "../../_components/coupon-form";

export const metadata: Metadata = {
  title: "עריכת קופון",
  robots: { index: false, follow: false },
};

type Params = { params: Promise<{ id: string }> };

export default async function EditCouponPage({ params }: Params) {
  const { id } = await params;
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) notFound();

  return (
    <div className="p-4 md:p-8 max-w-[1600px]">
      <div className="mb-3">
        <Link
          href="/admin/coupons"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 no-underline"
        >
          <ChevronRight className="size-3.5 rotate-180" />
          חזרה לרשימת קופונים
        </Link>
      </div>
      <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground mb-6">
        עריכת קופון: <span className="font-mono">{coupon.code}</span>
      </h1>
      <CouponForm coupon={coupon} />
    </div>
  );
}
