/**
 * Optional starter data for fresh deployments.
 *
 * ▶︎ This template ships with NO sample products. A new client will
 *   typically use /admin/import to bulk-load their real catalog from a
 *   Shopify or WooCommerce CSV — see the import wizard.
 *
 * ▶︎ This file seeds a small set of placeholder categories so the
 *   storefront has something to render on first run. Delete/rename
 *   them from /admin/categories once the client provides their real
 *   structure. To skip entirely, run `pnpm db:seed -- --skip-empty`
 *   or just remove the call to seedCategories() below.
 *
 * Usage: pnpm db:seed
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SeedCategory = {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  description: string;
  /** Optional parent id — references another row in this same array */
  parentId?: string;
};

const PLACEHOLDER_CATEGORIES: SeedCategory[] = [
  {
    id: "starter-new",
    slug: "new",
    name: "חדש",
    nameEn: "New",
    description: "פריטים חדשים שהגיעו לאחרונה.",
  },
  {
    id: "starter-popular",
    slug: "popular",
    name: "הנמכרים ביותר",
    nameEn: "Best Sellers",
    description: "הפריטים הכי אהובים בחנות.",
  },
  {
    id: "starter-sale",
    slug: "sale",
    name: "מבצעים",
    nameEn: "Sale",
    description: "פריטים במבצע, לזמן מוגבל.",
  },
];

async function seedCategories() {
  console.log("seeding placeholder categories…");
  // Two passes — parents first, then children. Avoids FK errors if a
  // child row references a parent that hasn't been inserted yet.
  const parents = PLACEHOLDER_CATEGORIES.filter((c) => !c.parentId);
  const children = PLACEHOLDER_CATEGORIES.filter((c) => c.parentId);

  for (let i = 0; i < parents.length; i++) {
    const c = parents[i];
    await prisma.category.upsert({
      where: { id: c.id },
      create: {
        id: c.id,
        slug: c.slug,
        name: c.name,
        nameEn: c.nameEn,
        cta: "לקולקציה",
        image: null,
        description: c.description,
        seoTitle: c.name,
        seoDescription: c.description,
        sortOrder: i,
        parentId: null,
      },
      update: {},
    });
  }
  for (let i = 0; i < children.length; i++) {
    const c = children[i];
    await prisma.category.upsert({
      where: { id: c.id },
      create: {
        id: c.id,
        slug: c.slug,
        name: c.name,
        nameEn: c.nameEn,
        cta: "לקולקציה",
        image: null,
        description: c.description,
        seoTitle: c.name,
        seoDescription: c.description,
        sortOrder: i,
        parentId: c.parentId!,
      },
      update: { parentId: c.parentId! },
    });
  }
  console.log(
    `✓ Seeded ${parents.length} top-level + ${children.length} subcategories`,
  );
}

async function main() {
  const args = new Set(process.argv.slice(2));
  if (!args.has("--skip-empty")) {
    await seedCategories();
  }
  console.log("→ Done. Next steps: create an admin via `pnpm tsx prisma/make-admin.ts`, then import products via /admin/import.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
