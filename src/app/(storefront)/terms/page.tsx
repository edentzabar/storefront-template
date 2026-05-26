import type { Metadata } from "next";
import { InfoPage } from "@/components/site/info-page";
import { termsContent } from "@/lib/data/static-pages";

export const metadata: Metadata = {
  title: "תקנון",
  description: "תקנון השימוש באתר.",
};

export default function TermsPage() {
  return (
    <InfoPage
      title="תקנון האתר"
      eyebrow="Terms"
      blocks={termsContent}
      breadcrumbLabel="תקנון"
    />
  );
}
