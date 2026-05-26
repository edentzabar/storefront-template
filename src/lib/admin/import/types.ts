/** Normalized product shape used during import — the common denominator
 *  between Shopify, WooCommerce, and (eventually) generic CSVs.
 */
export type ImportedProduct = {
  name: string;
  nameEn?: string;
  slug?: string; // optional — generated server-side if missing
  sku: string;
  meta?: string;
  description: string;
  price: number; // ILS, no decimals
  originalPrice?: number | null;
  stock: number;
  image: string; // first / primary image URL
  images: string[]; // additional image URLs (gallery)
  /** Free-text category name from the source. We'll map to our category later. */
  categoryHint: string;
  /** Free-form spec pairs ("metal: gold 14k") gathered from source attributes */
  specs?: Record<string, string>;
  isActive: boolean;
  isFeatured: boolean;
};

export type ImportFormat = "shopify" | "woocommerce" | "unknown";

export type ImportPreview = {
  format: ImportFormat;
  products: ImportedProduct[];
  rowCount: number;
  /** Distinct category hints found in the file — surfaced to user for mapping. */
  categoryHints: string[];
  /** Non-fatal warnings encountered during parsing (per row). */
  warnings: string[];
};

export type ImportResult = {
  attempted: number;
  created: number;
  skipped: number;
  errors: { sku: string; reason: string }[];
};

/** Products per batch — client loops these sequentially. Tuned to stay
 *  comfortably under Vercel's 60-second function limit even when each
 *  product has multiple images being downloaded to Blob. */
export const IMPORT_BATCH_SIZE = 3;
