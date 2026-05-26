import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CouponForm } from "../_components/coupon-form";

export const metadata: Metadata = {
  title: "קופון חדש",
  robots: { index: false, follow: false },
};

export default function NewCouponPage() {
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
        קופון חדש
      </h1>
      <CouponForm />
    </div>
  );
}
