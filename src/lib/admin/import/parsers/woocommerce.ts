import type { ImportedProduct } from "../types";
import { parseBoolean, parseInteger, parseNumber, stripHtml } from "../utils";

/** Detect WooCommerce CSV by signature columns. */
export function isWooFormat(headers: string[]): boolean {
  const set = new Set(headers.map((h) => h.toLowerCase()));
  return (
    set.has("sku") &&
    (set.has("regular price") || set.has("name")) &&
    (set.has("type") || set.has("published"))
  );
}

/**
 * Parse a WooCommerce product export CSV. Woo's default export is "one row
 * per product" (variants live in their own rows referencing Parent). We
 * keep only top-level products (Type=simple/variable, empty Parent).
 */
export function parseWoo(
  rows: Record<string, string>[],
): { products: ImportedProduct[]; warnings: string[] } {
  const warnings: string[] = [];
  const products: ImportedProduct[] = [];

  for (const row of rows) {
    const type = (row["Type"] ?? "").toLowerCase().trim();
    const parent = (row["Parent"] ?? "").trim();

    // Skip variations / grouped children; only keep top-level products
    if (type === "variation" || parent !== "") continue;

    const name = (row["Name"] ?? "").trim();
    if (!name) {
      warnings.push(`שורה בלי שם, מדלגים`);
      continue;
    }

    const sku = (row["SKU"] ?? "").trim() || `woo-${name.slice(0, 12)}`;

    // WooCommerce uses "Regular price" + "Sale price" — when sale is active,
    // the customer-facing price is Sale; Regular becomes "compare at".
    const regular = parseNumber(row["Regular price"]) ?? 0;
    const sale = parseNumber(row["Sale price"]);
    const price = sale != null && sale > 0 ? sale : regular;
    const originalPrice = sale != null && sale > 0 ? regular : null;

    const stock = parseInteger(row["Stock"], 0);
    const isActive =
      parseBoolean(row["Published"], true) ||
      (row["Visibility in catalog"] ?? "").toLowerCase() === "visible";

    const isFeatured = parseBoolean(row["Is featured?"], false);

    const description = stripHtml(row["Description"] ?? "");
    const meta = stripHtml(row["Short description"] ?? "");

    // Images: comma-separated URLs (Woo's default format)
    const imageStr = (row["Images"] ?? "").trim();
    const images = imageStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const image = images[0] ?? "";
    if (!image) {
      warnings.push(`${name} — אין תמונה`);
    }

    // Categories: "Clothing > T-shirts, Sale" — take first leaf segment
    const categoriesStr = (row["Categories"] ?? "").trim();
    const firstCategory = categoriesStr.split(",")[0]?.trim() ?? "";
    const categoryHint = firstCategory.includes(">")
      ? firstCategory.split(">").pop()!.trim()
      : firstCategory;

    // Attributes → specs: "Attribute 1 name" + "Attribute 1 value(s)", up to 3
    const specs: Record<string, string> = {};
    for (let i = 1; i <= 3; i++) {
      const k = (row[`Attribute ${i} name`] ?? "").trim();
      const v = (row[`Attribute ${i} value(s)`] ?? "").trim();
      if (k && v) specs[k] = v;
    }

    products.push({
      name,
      sku,
      meta: meta || undefined,
      description,
      price: Math.round(price),
      originalPrice: originalPrice != null ? Math.round(originalPrice) : null,
      stock,
      image,
      images: images.slice(1),
      categoryHint,
      specs: Object.keys(specs).length ? specs : undefined,
      isActive,
      isFeatured,
    });
  }

  return { products, warnings };
}
