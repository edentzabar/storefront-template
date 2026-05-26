import type { ImportFormat, ImportPreview } from "./types";
import { isShopifyFormat, parseShopify } from "./parsers/shopify";
import { isWooFormat, parseWoo } from "./parsers/woocommerce";

/** Detect the format of a parsed CSV by inspecting its headers. */
export function detectFormat(headers: string[]): ImportFormat {
  if (isShopifyFormat(headers)) return "shopify";
  if (isWooFormat(headers)) return "woocommerce";
  return "unknown";
}

/**
 * Parse a list of CSV rows (already parsed by papaparse) into our
 * normalized ImportedProduct shape, choosing the parser by detected
 * format. Pure — does not touch the DB.
 */
export function parseImportRows(
  headers: string[],
  rows: Record<string, string>[],
): ImportPreview {
  const format = detectFormat(headers);
  let products: ImportPreview["products"] = [];
  let warnings: string[] = [];

  if (format === "shopify") ({ products, warnings } = parseShopify(rows));
  else if (format === "woocommerce") ({ products, warnings } = parseWoo(rows));

  const categoryHints = Array.from(
    new Set(products.map((p) => p.categoryHint).filter(Boolean)),
  ).sort();

  return {
    format,
    products,
    rowCount: rows.length,
    categoryHints,
    warnings,
  };
}
