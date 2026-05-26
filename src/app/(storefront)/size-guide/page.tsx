import type { Metadata } from "next";
import { InfoPage } from "@/components/site/info-page";
import { sizeGuideContent } from "@/lib/data/static-pages";

export const metadata: Metadata = {
  title: "מדריך מידות",
  description: "איך למדוד את המידות הנכונות למוצרים שלנו.",
};

export default function SizeGuidePage() {
  return (
    <InfoPage
      title="מדריך מידות"
      eyebrow="Size Guide"
      blocks={sizeGuideContent}
      breadcrumbLabel="מדריך מידות"
    />
  );
}
