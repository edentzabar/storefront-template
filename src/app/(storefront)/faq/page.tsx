import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { PageHero } from "@/components/site/page-hero";
import { faqContent } from "@/lib/data/static-pages";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "שאלות נפוצות",
  description: "תשובות לשאלות נפוצות על המוצרים, המשלוחים והאחריות.",
};

export default function FaqPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqContent.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Breadcrumbs items={[{ label: "בית", href: "/" }, { label: "שאלות נפוצות" }]} />
      <PageHero title="שאלות נפוצות" eyebrow="FAQ" />
      <main className="py-14 px-6 lg:px-10">
        <div className="max-w-[820px] mx-auto">
          <Accordion className="space-y-1">
            {faqContent.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-[1rem] font-medium text-brand-primary">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-[0.95rem] leading-loose text-brand-text font-light">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </main>
    </>
  );
}
