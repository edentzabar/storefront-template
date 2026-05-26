import type { ImportedProduct } from "../types";
import { parseBoolean, parseInteger, parseNumber, stripHtml } from "../utils";

/** Detect if rows look like a Shopify product export. */
export function isShopifyFormat(headers: string[]): boolean {
  const set = new Set(headers.map((h) => h.toLowerCase()));
  return set.has("handle") && (set.has("variant sku") || set.has("variant price"));
}

/**
 * Parse a Shopify product export CSV. Shopify spreads a product across
 * multiple rows — one per variant + extra rows for additional images.
 * We group by Handle and treat the first row as the canonical product.
 * Additional image rows (empty Title) contribute to the gallery.
 */
export function parseShopify(
  rows: Record<string, string>[],
): { products: ImportedProduct[]; warnings: string[] } {
  const warnings: string[] = [];
  const grouped = new Map<string, Record<string, string>[]>();

  for (const row of rows) {
    const handle = (row["Handle"] ?? "").trim();
    if (!handle) continue;
    const existing = grouped.get(handle);
    if (existing) existing.push(row);
    else grouped.set(handle, [row]);
  }

  const products: ImportedProduct[] = [];

  for (const [handle, productRows] of grouped) {
    // The "main" row has a non-empty Title
    const main =
      productRows.find((r) => (r["Title"] ?? "").trim() !== "") ?? productRows[0];

    const name = (main["Title"] ?? "").trim();
    if (!name) {
      warnings.push(`Handle "${handle}" — אין כותרת, מדלג`);
      continue;
    }

    // Image gallery: collect all non-empty Image Src values, deduplicate
    const imageSet = new Set<string>();
    for (const r of productRows) {
      const src = (r["Image Src"] ?? "").trim();
      if (src) imageSet.add(src);
    }
    const images = Array.from(imageSet);
    const image = images[0] ?? "";
    if (!image) {
      warnings.push(`${name} — אין תמונה`);
    }

    const price = parseNumber(main["Variant Price"]) ?? 0;
    const originalPrice = parseNumber(main["Variant Compare At Price"]);
    const sku = (main["Variant SKU"] ?? "").trim() || `shopify-${handle}`;
    const stock = parseInteger(main["Variant Inventory Qty"], 0);

    // Published in Shopify: "TRUE"/"FALSE" or "true"/"false". Status column also exists.
    const isActive =
      parseBoolean(main["Published"], true) ||
      (main["Status"] ?? "").toLowerCase() === "active";

    const description = stripHtml(main["Body (HTML)"] ?? "");
    const categoryHint =
      (main["Product Category"] ?? "").trim() ||
      (main["Type"] ?? "").trim() ||
      "";

    // Pull options as specs (Option1 Name + Option1 Value, etc.)
    const specs: Record<string, string> = {};
    for (let i = 1; i <= 3; i++) {
      const k = (main[`Option${i} Name`] ?? "").trim();
      const v = (main[`Option${i} Value`] ?? "").trim();
      if (k && v && k.toLowerCase() !== "title" && v.toLowerCase() !== "default title") {
        specs[k] = v;
      }
    }

    products.push({
      name,
      slug: handle, // shopify handles are already URL-safe
      sku,
      description,
      price: Math.round(price),
      originalPrice: originalPrice != null ? Math.round(originalPrice) : null,
      stock,
      image,
      images: images.slice(1), // gallery excludes the primary image
      categoryHint,
      specs: Object.keys(specs).length ? specs : undefined,
      isActive,
      isFeatured: false,
    });
  }

  return { products, warnings };
}
