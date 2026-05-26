import type { Metadata } from "next";
import { InfoPage } from "@/components/site/info-page";
import { returnsContent } from "@/lib/data/static-pages";

export const metadata: Metadata = {
  title: "החזרות והחלפות",
  description: "מדיניות החזרות והחלפות.",
};

export default function ReturnsPage() {
  return (
    <InfoPage
      title="החזרות והחלפות"
      eyebrow="Returns"
      blocks={returnsContent}
      breadcrumbLabel="החזרות"
    />
  );
}
