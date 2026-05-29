"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/session";

/**
 * Bulk operations on products — invoked by the bulk-action toolbar on
 * /admin/products. Each action:
 *   • verifies the caller is an admin
 *   • validates input with zod (return-error pattern, no throws)
 *   • runs the mutation in a single `updateMany` / transaction
 *   • revalidates the relevant cache tags / paths
 *
 * The shape `{ ok, updatedCount, error }` is consumed by the client to
 * show a single toast + refresh the table.
 */

export type BulkResult = {
  ok: boolean;
  updatedCount: number;
  error?: string;
};

async function assertAdmin() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
}

/** Hard ceiling — prevents an accidental "select all" on 10k products
 *  from running unbounded queries. The UI shows a warning past this. */
const MAX_BULK = 500;

const idsSchema = z.array(z.string().min(1)).min(1).max(MAX_BULK);

/** ──────── Price ──────── */

const priceModeSchema = z.union([
  z.object({ mode: z.literal("set"), value: z.number().int().min(0) }),
  z.object({ mode: z.literal("increase-pct"), value: z.number().min(0).max(1000) }),
  z.object({ mode: z.literal("decrease-pct"), value: z.number().min(0).max(99) }),
  z.object({ mode: z.literal("set-original"), value: z.number().int().min(0).nullable() }),
]);

export async function bulkUpdatePrice(
  ids: string[],
  op: z.infer<typeof priceModeSchema>,
): Promise<BulkResult> {
  await assertAdmin();
  const parsedIds = idsSchema.safeParse(ids);
  if (!parsedIds.success) return { ok: false, updatedCount: 0, error: "ids לא חוקיים" };
  const parsedOp = priceModeSchema.safeParse(op);
  if (!parsedOp.success) return { ok: false, updatedCount: 0, error: "פעולה לא חוקית" };

  try {
    // For percentage modes we need each product's current price → loop in tx.
    // For absolute set we can do a single updateMany.
    if (parsedOp.data.mode === "set") {
      const r = await prisma.product.updateMany({
        where: { id: { in: parsedIds.data } },
        data: { price: parsedOp.data.value },
      });
      revalidatePath("/admin/products");
      revalidatePath("/shop");
      return { ok: true, updatedCount: r.count };
    }
    if (parsedOp.data.mode === "set-original") {
      const r = await prisma.product.updateMany({
        where: { id: { in: parsedIds.data } },
        data: { originalPrice: parsedOp.data.value },
      });
      revalidatePath("/admin/products");
      revalidatePath("/shop");
      return { ok: true, updatedCount: r.count };
    }

    // Percentage — needs per-product current price
    const products = await prisma.product.findMany({
      where: { id: { in: parsedIds.data } },
      select: { id: true, price: true },
    });
    const factor =
      parsedOp.data.mode === "increase-pct"
        ? 1 + parsedOp.data.value / 100
        : 1 - parsedOp.data.value / 100;
    await prisma.$transaction(
      products.map((p) =>
        prisma.product.update({
          where: { id: p.id },
          data: { price: Math.round(p.price * factor) },
        }),
      ),
    );
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    return { ok: true, updatedCount: products.length };
  } catch (err) {
    return {
      ok: false,
      updatedCount: 0,
      error: err instanceof Error ? err.message : "שגיאה בעדכון",
    };
  }
}

/** ──────── Stock ──────── */

const stockModeSchema = z.union([
  z.object({ mode: z.literal("set"), value: z.number().int().min(0) }),
  z.object({ mode: z.literal("increase"), value: z.number().int().min(1) }),
  z.object({ mode: z.literal("decrease"), value: z.number().int().min(1) }),
]);

export async function bulkUpdateStock(
  ids: string[],
  op: z.infer<typeof stockModeSchema>,
): Promise<BulkResult> {
  await assertAdmin();
  const parsedIds = idsSchema.safeParse(ids);
  if (!parsedIds.success) return { ok: false, updatedCount: 0, error: "ids לא חוקיים" };
  const parsedOp = stockModeSchema.safeParse(op);
  if (!parsedOp.success) return { ok: false, updatedCount: 0, error: "פעולה לא חוקית" };

  try {
    if (parsedOp.data.mode === "set") {
      const r = await prisma.product.updateMany({
        where: { id: { in: parsedIds.data } },
        data: { stock: parsedOp.data.value },
      });
      revalidatePath("/admin/products");
      return { ok: true, updatedCount: r.count };
    }

    // Increment / decrement — Prisma's `increment` / `decrement` operators
    if (parsedOp.data.mode === "increase") {
      const r = await prisma.product.updateMany({
        where: { id: { in: parsedIds.data } },
        data: { stock: { increment: parsedOp.data.value } },
      });
      revalidatePath("/admin/products");
      return { ok: true, updatedCount: r.count };
    }
    // decrease — clamp at 0 per-product to avoid negative stock
    const products = await prisma.product.findMany({
      where: { id: { in: parsedIds.data } },
      select: { id: true, stock: true },
    });
    await prisma.$transaction(
      products.map((p) =>
        prisma.product.update({
          where: { id: p.id },
          data: { stock: Math.max(0, p.stock - parsedOp.data.value) },
        }),
      ),
    );
    revalidatePath("/admin/products");
    return { ok: true, updatedCount: products.length };
  } catch (err) {
    return {
      ok: false,
      updatedCount: 0,
      error: err instanceof Error ? err.message : "שגיאה בעדכון",
    };
  }
}

/** ──────── Visibility / Featured (single-field toggles) ──────── */

export async function bulkSetActive(ids: string[], isActive: boolean): Promise<BulkResult> {
  await assertAdmin();
  const parsedIds = idsSchema.safeParse(ids);
  if (!parsedIds.success) return { ok: false, updatedCount: 0, error: "ids לא חוקיים" };
  try {
    const r = await prisma.product.updateMany({
      where: { id: { in: parsedIds.data } },
      data: { isActive },
    });
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    return { ok: true, updatedCount: r.count };
  } catch (err) {
    return {
      ok: false,
      updatedCount: 0,
      error: err instanceof Error ? err.message : "שגיאה בעדכון",
    };
  }
}

export async function bulkSetFeatured(ids: string[], isFeatured: boolean): Promise<BulkResult> {
  await assertAdmin();
  const parsedIds = idsSchema.safeParse(ids);
  if (!parsedIds.success) return { ok: false, updatedCount: 0, error: "ids לא חוקיים" };
  try {
    const r = await prisma.product.updateMany({
      where: { id: { in: parsedIds.data } },
      data: { isFeatured },
    });
    revalidatePath("/admin/products");
    revalidatePath("/");
    return { ok: true, updatedCount: r.count };
  } catch (err) {
    return {
      ok: false,
      updatedCount: 0,
      error: err instanceof Error ? err.message : "שגיאה בעדכון",
    };
  }
}

/** ──────── Move to category ──────── */

export async function bulkMoveToCategory(
  ids: string[],
  categoryId: string,
): Promise<BulkResult> {
  await assertAdmin();
  const parsedIds = idsSchema.safeParse(ids);
  if (!parsedIds.success) return { ok: false, updatedCount: 0, error: "ids לא חוקיים" };
  if (!categoryId) return { ok: false, updatedCount: 0, error: "קטגוריה חובה" };
  try {
    // Verify the target category exists (otherwise FK violation message
    // is unhelpful — we want a clear error)
    const exists = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!exists) return { ok: false, updatedCount: 0, error: "קטגוריה לא נמצאה" };

    const r = await prisma.product.updateMany({
      where: { id: { in: parsedIds.data } },
      data: { categoryId },
    });
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    return { ok: true, updatedCount: r.count };
  } catch (err) {
    return {
      ok: false,
      updatedCount: 0,
      error: err instanceof Error ? err.message : "שגיאה בעדכון",
    };
  }
}

/** ──────── Delete ──────── */

export async function bulkDelete(ids: string[]): Promise<BulkResult> {
  await assertAdmin();
  const parsedIds = idsSchema.safeParse(ids);
  if (!parsedIds.success) return { ok: false, updatedCount: 0, error: "ids לא חוקיים" };
  try {
    const r = await prisma.product.deleteMany({
      where: { id: { in: parsedIds.data } },
    });
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    return { ok: true, updatedCount: r.count };
  } catch (err) {
    return {
      ok: false,
      updatedCount: 0,
      error: err instanceof Error ? err.message : "שגיאה במחיקה",
    };
  }
}
