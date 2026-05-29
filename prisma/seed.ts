/**
 * Demo / starter data for fresh deployments.
 *
 * ▶︎ Ships with a small but realistic content set so a fresh fork of
 *   the template renders as a working store on day 1, not a half-empty
 *   skeleton. Easier for clients to evaluate, easier for you to demo.
 *
 * ▶︎ A real client will replace all of this from /admin (categories,
 *   products) or via /admin/import (bulk CSV from Shopify/WooCommerce).
 *
 * ▶︎ Skip everything: `pnpm db:seed -- --skip-empty`
 *   Skip just products: `pnpm db:seed -- --no-products`
 *
 * Usage: pnpm db:seed
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* ────────────────────── Categories ────────────────────── */

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
  // ── Top-level ──
  {
    id: "starter-new",
    slug: "new",
    name: "חדש בחנות",
    nameEn: "New",
    description: "פריטים שהגיעו לאחרונה.",
  },
  {
    id: "starter-popular",
    slug: "popular",
    name: "הנמכרים ביותר",
    nameEn: "Best Sellers",
    description: "הפריטים הכי אהובים בחנות.",
  },
  {
    id: "starter-accessories",
    slug: "accessories",
    name: "אביזרים",
    nameEn: "Accessories",
    description: "אוסף אביזרים מעוצבים. מרחפים מעל הקטגוריה בנאב — תראו את התתי-קטגוריות.",
  },
  {
    id: "starter-gifts",
    slug: "gifts",
    name: "מתנות",
    nameEn: "Gifts",
    description: "מתנות לכל אירוע.",
  },
  {
    id: "starter-sale",
    slug: "sale",
    name: "מבצעים",
    nameEn: "Sale",
    description: "פריטים במבצע, לזמן מוגבל.",
  },
  // ── Children under "אביזרים" — demonstrates the hierarchy feature ──
  {
    id: "starter-accessories-bags",
    slug: "bags",
    name: "תיקים",
    nameEn: "Bags",
    description: "תיקי יד, גב, ערב.",
    parentId: "starter-accessories",
  },
  {
    id: "starter-accessories-hats",
    slug: "hats",
    name: "כובעים",
    nameEn: "Hats",
    description: "כובעים לכל עונה.",
    parentId: "starter-accessories",
  },
  {
    id: "starter-accessories-belts",
    slug: "belts",
    name: "חגורות",
    nameEn: "Belts",
    description: "חגורות עור ובד.",
    parentId: "starter-accessories",
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

/* ────────────────────── Products ────────────────────── */

const PLACEHOLDER_PRODUCTS = [
  {
    id: "demo-product-1",
    slug: "demo-product-1",
    name: "מוצר לדוגמה",
    nameEn: "Sample Product",
    meta: "תיאור קצר אופציונלי",
    description: "מוצר דוגמה לתצוגה. החליפו אותו ב-/admin/products או דרך ייבוא CSV.",
    price: 149,
    originalPrice: null as number | null,
    sku: "DEMO-001",
    image: "/brand/products/p1.jpg",
    categoryId: "starter-new",
    badge: "חדש",
    badgeType: "new" as const,
  },
  {
    id: "demo-product-2",
    slug: "demo-product-2",
    name: "מוצר פופולרי",
    nameEn: "Popular Product",
    meta: "הכי נמכר השבוע",
    description: "מוצר דוגמה נוסף. ערכו / מחקו ב-/admin/products.",
    price: 89,
    originalPrice: 129,
    sku: "DEMO-002",
    image: "/brand/products/p2.jpg",
    categoryId: "starter-popular",
    badge: "מבצע",
    badgeType: "sale" as const,
  },
  {
    id: "demo-product-3",
    slug: "demo-product-3",
    name: "תיק קלאסי",
    nameEn: "Classic Bag",
    meta: "עור איכותי",
    description: "תיק לדוגמה תחת תת-הקטגוריה תיקים — מציג את ההיררכיה.",
    price: 229,
    originalPrice: null,
    sku: "DEMO-003",
    image: "/brand/products/p3.jpg",
    categoryId: "starter-accessories-bags",
    badge: null,
    badgeType: null,
  },
  {
    id: "demo-product-4",
    slug: "demo-product-4",
    name: "כובע קיץ",
    nameEn: "Summer Hat",
    meta: "אחד בכמה צבעים",
    description: "מוצר דוגמה תחת תת-הקטגוריה כובעים.",
    price: 59,
    originalPrice: null,
    sku: "DEMO-004",
    image: "/brand/products/p4.jpg",
    categoryId: "starter-accessories-hats",
    badge: null,
    badgeType: null,
  },
  {
    id: "demo-product-5",
    slug: "demo-product-5",
    name: "מתנה מעוצבת",
    nameEn: "Designed Gift",
    meta: "אריזה כלולה",
    description: "מתנה לדוגמה. החליפו במוצרים אמיתיים דרך האדמין.",
    price: 119,
    originalPrice: null,
    sku: "DEMO-005",
    image: "/brand/products/p5.jpg",
    categoryId: "starter-gifts",
    badge: "מתנה",
    badgeType: null,
  },
  {
    id: "demo-product-6",
    slug: "demo-product-6",
    name: "פריט מבצע",
    nameEn: "Sale Item",
    meta: "מלאי מוגבל",
    description: "פריט בקטגוריית מבצעים — להציג את תווית ההנחה.",
    price: 49,
    originalPrice: 89,
    sku: "DEMO-006",
    image: "/brand/products/p6.jpg",
    categoryId: "starter-sale",
    badge: "מבצע",
    badgeType: "sale" as const,
  },
];

async function seedProducts() {
  console.log("seeding placeholder products…");
  for (let i = 0; i < PLACEHOLDER_PRODUCTS.length; i++) {
    const p = PLACEHOLDER_PRODUCTS[i];
    await prisma.product.upsert({
      where: { id: p.id },
      create: {
        id: p.id,
        slug: p.slug,
        categoryId: p.categoryId,
        name: p.name,
        nameEn: p.nameEn,
        meta: p.meta,
        description: p.description,
        price: p.price,
        originalPrice: p.originalPrice,
        sku: p.sku,
        stock: 10,
        image: p.image,
        images: [],
        specs: {},
        sizes: [],
        badge: p.badge,
        badgeType: p.badgeType,
        isFeatured: true,
        sortOrder: i,
      },
      update: {},
    });
  }
  console.log(`✓ Seeded ${PLACEHOLDER_PRODUCTS.length} placeholder products`);
}

/* ────────────────────── Entry ────────────────────── */

async function main() {
  const args = new Set(process.argv.slice(2));
  if (args.has("--skip-empty")) {
    console.log("→ --skip-empty given. Nothing to do.");
    return;
  }
  await seedCategories();
  if (!args.has("--no-products")) {
    await seedProducts();
  }
  console.log(
    "→ Done. Next: `pnpm db:make-admin <email>` to promote your first user, then start editing real content at /admin.",
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
