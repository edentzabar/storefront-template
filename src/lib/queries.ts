import "server-only";
import type {
  Category as PrismaCategory,
  Product as PrismaProduct,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

// ---------- view types (what storefront components consume) ----------

export type CategoryView = {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  cta: string;
  image: string | null;
  description: string;
  seoTitle: string;
  seoDescription: string;
  parentId: string | null;
};

/** Top-level category with its children nested — used by storefront
 *  nav dropdowns + homepage tile grid. */
export type CategoryTreeNode = CategoryView & { children: CategoryView[] };

export type ProductView = {
  id: string;
  slug: string;
  category: string; // categoryId — kept as `category` to match existing component code
  name: string;
  nameEn: string;
  meta: string;
  description: string;
  price: number;
  originalPrice: number | null;
  badge: string | null;
  badgeType: "new" | "sale" | null;
  sku: string;
  stock: number;
  image: string;
  images: string[];
  specs: Record<string, string>;
  sizes?: string[];
  careInstructions?: string;
};

function serializeCategory(c: PrismaCategory): CategoryView {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    nameEn: c.nameEn,
    cta: c.cta,
    image: c.image,
    description: c.description,
    seoTitle: c.seoTitle,
    seoDescription: c.seoDescription,
    parentId: c.parentId,
  };
}

function serializeProduct(p: PrismaProduct): ProductView {
  return {
    id: p.id,
    slug: p.slug,
    category: p.categoryId,
    name: p.name,
    nameEn: p.nameEn,
    meta: p.meta,
    description: p.description,
    price: p.price,
    originalPrice: p.originalPrice,
    badge: p.badge,
    badgeType: (p.badgeType as ProductView["badgeType"]) ?? null,
    sku: p.sku,
    stock: p.stock,
    image: p.image,
    images: ((p.images as unknown as string[] | null) ?? []),
    specs: ((p.specs as unknown as Record<string, string> | null) ?? {}),
    sizes: ((p.sizes as unknown as string[] | null) ?? undefined) || undefined,
    careInstructions: p.careInstructions ?? undefined,
  };
}

// ---------- products ----------

export async function getAllProducts(): Promise<ProductView[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { isFeatured: "desc" }, { createdAt: "desc" }],
  });
  return rows.map(serializeProduct);
}

export async function getFeaturedProducts(limit = 8): Promise<ProductView[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    take: limit,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(serializeProduct);
}

export async function getSaleProducts(): Promise<ProductView[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true, NOT: { originalPrice: null } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(serializeProduct);
}

export async function getProductBySlug(slug: string): Promise<ProductView | null> {
  const p = await prisma.product.findFirst({
    where: { slug, isActive: true },
  });
  return p ? serializeProduct(p) : null;
}

export async function getProductsByCategoryId(categoryId: string): Promise<ProductView[]> {
  const rows = await prisma.product.findMany({
    where: { categoryId, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { isFeatured: "desc" }, { createdAt: "desc" }],
  });
  return rows.map(serializeProduct);
}

export async function getProductsByIds(ids: string[]): Promise<ProductView[]> {
  if (ids.length === 0) return [];
  const rows = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true },
  });
  return rows.map(serializeProduct);
}

export async function getRelatedProducts(slug: string, limit = 4): Promise<ProductView[]> {
  const product = await prisma.product.findFirst({ where: { slug } });
  if (!product) return [];
  const sameCat = await prisma.product.findMany({
    where: { categoryId: product.categoryId, slug: { not: slug }, isActive: true },
    take: limit,
  });
  if (sameCat.length >= limit) return sameCat.map(serializeProduct);
  const others = await prisma.product.findMany({
    where: { slug: { not: slug }, categoryId: { not: product.categoryId }, isActive: true },
    take: limit - sameCat.length,
  });
  return [...sameCat, ...others].map(serializeProduct);
}

// ---------- categories ----------

export async function getAllCategories(): Promise<CategoryView[]> {
  const rows = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map(serializeCategory);
}

/**
 * Top-level (parentId=null) categories with their subcategories nested.
 * Used by storefront nav dropdowns + grid components that should only
 * render parents at the top level. Filtering by parentId in JS rather
 * than in Prisma's `where` sidesteps PrismaClientValidationError on
 * nullable scalar filters in current Prisma versions.
 */
export async function getCategoryTree(): Promise<CategoryTreeNode[]> {
  const rows = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  const all = rows.map(serializeCategory);
  // Loose equality — defensive in case a stale Prisma client serializes
  // a brand-new parentId column as undefined instead of null.
  const topLevel = all.filter((c) => !c.parentId);
  return topLevel.map((parent) => ({
    ...parent,
    children: all.filter((c) => c.parentId === parent.id),
  }));
}

export async function getFeaturedCategories(limit = 3): Promise<CategoryView[]> {
  // Featured tiles only show top-level categories. Children belong in
  // dropdowns / category-page sidebars, not as standalone tiles.
  const rows = await prisma.category.findMany({
    where: { isActive: true, image: { not: null } },
    orderBy: { sortOrder: "asc" },
    take: limit * 4, // fetch generously; we'll filter children in JS
  });
  return rows
    .filter((c) => !c.parentId)
    .slice(0, limit)
    .map(serializeCategory);
}

export async function getCategoryBySlug(slug: string): Promise<CategoryView | null> {
  const c = await prisma.category.findFirst({
    where: { slug, isActive: true },
  });
  return c ? serializeCategory(c) : null;
}

export async function getCategoryById(id: string): Promise<CategoryView | null> {
  const c = await prisma.category.findUnique({ where: { id } });
  return c ? serializeCategory(c) : null;
}

// ---------- slugs (for generateStaticParams) ----------

export async function getAllProductSlugs(): Promise<string[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true },
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}

export async function getAllCategorySlugs(): Promise<string[]> {
  const rows = await prisma.category.findMany({
    where: { isActive: true },
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}

// ---------- admin / dashboard ----------

export async function getAllOrders() {
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
}

export async function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
}

export async function getOrdersByUser(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: { orderBy: { position: "asc" } } },
  });
}

export async function getAllCustomers() {
  return prisma.user.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getDashboardStats() {
  const [products, categories, orders, customers] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.order.count(),
    prisma.user.count(),
  ]);
  return { products, categories, orders, customers };
}
