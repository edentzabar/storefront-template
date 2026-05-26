import type { Metadata } from "next";
import { InfoPage } from "@/components/site/info-page";
import { privacyContent } from "@/lib/data/static-pages";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "מדיניות פרטיות",
  description: `מדיניות הפרטיות של ${siteConfig.name}.`,
};

export default function PrivacyPage() {
  return (
    <InfoPage
      title="מדיניות פרטיות"
      eyebrow="Privacy"
      blocks={privacyContent}
      breadcrumbLabel="פרטיות"
    />
  );
}
