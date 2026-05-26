import { PageHero } from "./page-hero";
import { Breadcrumbs } from "./breadcrumbs";
import type { StaticBlock } from "@/lib/data/static-pages";

type Props = {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  blocks: StaticBlock[];
  breadcrumbLabel: string;
};

export function InfoPage({ title, eyebrow, subtitle, blocks, breadcrumbLabel }: Props) {
  return (
    <>
      <Breadcrumbs items={[{ label: "בית", href: "/" }, { label: breadcrumbLabel }]} />
      <PageHero title={title} eyebrow={eyebrow} subtitle={subtitle} />
      <main className="py-14 px-6 lg:px-10">
        <div className="max-w-[820px] mx-auto space-y-10">
          {blocks.map((block, i) => (
            <section key={i}>
              <h2 className="font-body text-xl font-medium mb-3 text-brand-primary">
                {block.heading}
              </h2>
              <p className="text-[0.98rem] leading-loose text-brand-text font-light">
                {block.body}
              </p>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
