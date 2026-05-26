import type { Metadata } from "next";
import { InfoPage } from "@/components/site/info-page";
import { aboutContent } from "@/lib/data/static-pages";

export const metadata: Metadata = {
  title: "אודות הסטודיו",
  description: aboutContent.subtitle,
};

export default function AboutPage() {
  return (
    <InfoPage
      title={aboutContent.title}
      eyebrow={aboutContent.eyebrow}
      subtitle={aboutContent.subtitle}
      blocks={aboutContent.blocks}
      breadcrumbLabel="אודות"
    />
  );
}
