"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/session";
import { slugify } from "./utils";
import type { ImportResult } from "./types";

async function assertAdmin() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
}

const productSchema = z.object({
  name: z.string().min(1),
  nameEn: z.string().optional(),
  slug: z.string().optional(),
  sku: z.string().min(1),
  meta: z.string().optional(),
  description: z.string(),
  price: z.number().int().min(0),
  originalPrice: z.number().int().min(0).nullable().optional(),
  stock: z.number().int().min(0),
  image: z.string(),
  images: z.array(z.string()),
  categoryHint: z.string(),
  specs: z.record(z.string(), z.string()).optional(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
});

const batchSchema = z.object({
  products: z.array(productSchema).min(1).max(50),
  categoryId: z.string().min(1),
  fallbackImage: z.string().optional(),
  downloadImages: z.boolean().default(true),
});

export type ImportBatchResult = Omit<ImportResult, "attempted"> & {
  processed: number;
};

/**
 * Download a remote image and re-upload to Vercel Blob. Returns the new
 * URL on success, or the original URL on any failure (network, missing
 * BLOB token, etc.) — failures must never break import.
 */
async function downloadToBlob(url: string, baseName: string): Promise<string> {
  if (!url) return url;
  // Already on our own Blob — skip
  if (url.includes("vercel-storage.com")) return url;
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    // No Blob configured — keep the original URL
    return url;
  }

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
      // Some shop CDNs block requests without a UA
      headers: { "User-Agent": "Mozilla/5.0 (compatible; StorefrontImporter/1.0)" },
    });
    if (!res.ok) return url;

    const blob = await res.blob();
    if (blob.size === 0) return url;

    // Guess extension from URL path
    const pathname = url.split("?")[0];
    const extMatch = pathname.match(/\.(jpe?g|png|webp|avif|svg|gif)$/i);
    const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";

    const safeName = `imported/${baseName}.${ext}`;
    const uploaded = await put(safeName, blob, {
      access: "public",
      addRandomSuffix: true,
    });
    return uploaded.url;
  } catch {
    return url; // graceful — fall back to original URL
  }
}

/** Import a single batch of products. Designed to fit comfortably inside
 *  Vercel Hobby's 60-second function limit (batch size + per-image timeout
 *  are tuned together). The client loops batches and aggregates results. */
export async function importProductBatch(input: unknown): Promise<ImportBatchResult> {
  await assertAdmin();
  const parsed = batchSchema.safeParse(input);
  if (!parsed.success) {
    return {
      processed: 0,
      created: 0,
      skipped: 0,
      errors: [{ sku: "-", reason: parsed.error.issues[0]?.message ?? "קלט לא חוקי" }],
    };
  }

  const { products, categoryId, fallbackImage, downloadImages } = parsed.data;

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    return {
      processed: 0,
      created: 0,
      skipped: 0,
      errors: [{ sku: "-", reason: "קטגוריה לא נמצאה" }],
    };
  }

  // De-dupe against existing SKUs in one query
  const incomingSkus = products.map((p) => p.sku);
  const existing = await prisma.product.findMany({
    where: { sku: { in: incomingSkus } },
    select: { sku: true },
  });
  const existingSkus = new Set(existing.map((e) => e.sku));

  let created = 0;
  let skipped = 0;
  const errors: ImportBatchResult["errors"] = [];

  // Process products in parallel within the batch
  await Promise.all(
    products.map(async (p) => {
      if (existingSkus.has(p.sku)) {
        skipped++;
        return;
      }

      // Resolve / download primary image
      let mainImage = p.image || fallbackImage || "";
      if (!mainImage) {
        errors.push({ sku: p.sku, reason: "אין תמונה ולא הוגדרה תמונת ברירת מחדל" });
        return;
      }
      if (downloadImages) {
        mainImage = await downloadToBlob(mainImage, `${p.sku}-main`);
      }

      // Resolve / download gallery images (in parallel)
      let galleryImages: string[] = p.images;
      if (downloadImages && p.images.length > 0) {
        galleryImages = await Promise.all(
          p.images.map((url, idx) => downloadToBlob(url, `${p.sku}-${idx + 1}`)),
        );
      }

      // Slug: provided → nameEn → SKU
      let slug = p.slug?.trim() || slugify(p.nameEn ?? "") || slugify(p.sku);
      const slugExists = await prisma.product.findUnique({ where: { slug } });
      if (slugExists) slug = `${slug}-${p.sku.toLowerCase()}`;

      try {
        await prisma.product.create({
          data: {
            slug,
            categoryId,
            name: p.name,
            nameEn: p.nameEn ?? "",
            meta: p.meta ?? "",
            description: p.description,
            price: p.price,
            originalPrice: p.originalPrice ?? null,
            sku: p.sku,
            stock: p.stock,
            image: mainImage,
            images: galleryImages,
            specs: p.specs ?? {},
            sizes: [],
            isActive: p.isActive,
            isFeatured: p.isFeatured,
          },
        });
        created++;
      } catch (err) {
        errors.push({
          sku: p.sku,
          reason: err instanceof Error ? err.message : "שגיאה לא ידועה",
        });
      }
    }),
  );

  return { processed: products.length, created, skipped, errors };
}

/** Final revalidate after the whole import loop finishes. */
export async function finalizeImport() {
  await assertAdmin();
  revalidatePath("/admin/products");
  return { ok: true };
}
