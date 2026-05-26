import type { Metadata } from "next";
import { InfoPage } from "@/components/site/info-page";
import { shippingContent } from "@/lib/data/static-pages";

export const metadata: Metadata = {
  title: "משלוחים",
  description: "מידע על משלוחים, זמני אספקה ואיסוף עצמי.",
};

export default function ShippingPage() {
  return (
    <InfoPage
      title="משלוחים"
      eyebrow="Shipping"
      blocks={shippingContent}
      breadcrumbLabel="משלוחים"
    />
  );
}
