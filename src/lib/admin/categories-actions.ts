"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/session";

/* ────────────── Schemas ────────────── */

const baseFields = {
  slug: z.string().min(1, "slug חובה").regex(/^[a-z0-9-]+$/, "slug: אותיות קטנות באנגלית"),
  name: z.string().min(1, "שם חובה"),
  nameEn: z.string().min(1, "שם באנגלית חובה"),
};

const categorySchema = z.object({
  ...baseFields,
  cta: z.string().default(""),
  image: z.string().nullable().optional(),
  description: z.string().default(""),
  seoTitle: z.string().default(""),
  seoDescription: z.string().default(""),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.coerce.boolean().default(true),
});

/** Children submitted inline from a top-level category form. */
const childInput = z.object({
  id: z.string().optional(), // empty → create new
  ...baseFields,
});
const childrenSchema = z.array(childInput).default([]);

export type CategoryFormState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Partial<Record<keyof z.infer<typeof categorySchema>, string>>;
};

function formDataToObject(formData: FormData) {
  const obj: Record<string, FormDataEntryValue | boolean | null> = {};
  for (const [k, v] of formData.entries()) obj[k] = v;
  obj.isActive = formData.get("isActive") === "on" || formData.get("isActive") === "true";
  if (obj.image === "") obj.image = null;
  return obj;
}

/**
 * Children come in as a single JSON-encoded `children` form field. The
 * client serializes the rows; we parse + validate here. Returns null
 * on parse error so the caller can show a clean validation message.
 */
function parseChildrenField(formData: FormData) {
  const raw = formData.get("children");
  if (typeof raw !== "string" || raw === "") return [];
  try {
    const parsed = childrenSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

async function assertAdmin() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
}

/* ────────────── Create ────────────── */

export async function createCategory(
  _: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await assertAdmin();
  const parsed = categorySchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    const fe: CategoryFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0] as keyof z.infer<typeof categorySchema>;
      if (!fe[k]) fe[k] = issue.message;
    }
    return { ok: false, error: "ולידציה נכשלה", fieldErrors: fe };
  }

  const children = parseChildrenField(formData);
  if (children === null) {
    return { ok: false, error: "תתי-הקטגוריות שנשלחו לא תקינות" };
  }

  // New categories from this form are always top-level. Subcategories are
  // created exclusively through their parent's children editor.
  try {
    await prisma.$transaction(async (tx) => {
      const parent = await tx.category.create({
        data: {
          slug: parsed.data.slug,
          name: parsed.data.name,
          nameEn: parsed.data.nameEn,
          cta: parsed.data.cta,
          image: parsed.data.image ?? null,
          description: parsed.data.description,
          seoTitle: parsed.data.seoTitle,
          seoDescription: parsed.data.seoDescription,
          sortOrder: parsed.data.sortOrder,
          isActive: parsed.data.isActive,
          parentId: null,
        },
      });
      for (let i = 0; i < children.length; i++) {
        const c = children[i];
        await tx.category.create({
          data: {
            slug: c.slug,
            name: c.name,
            nameEn: c.nameEn,
            sortOrder: i,
            parentId: parent.id,
          },
        });
      }
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "שגיאה ביצירה" };
  }
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

/* ────────────── Update ────────────── */

export async function updateCategory(
  categoryId: string,
  _: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await assertAdmin();
  const parsed = categorySchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    const fe: CategoryFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0] as keyof z.infer<typeof categorySchema>;
      if (!fe[k]) fe[k] = issue.message;
    }
    return { ok: false, error: "ולידציה נכשלה", fieldErrors: fe };
  }

  const children = parseChildrenField(formData);
  if (children === null) {
    return { ok: false, error: "תתי-הקטגוריות שנשלחו לא תקינות" };
  }

  // We DON'T accept parentId from the form anymore — the cat's
  // parentId stays whatever the DB has (subcategories' parent is fixed,
  // top-level stays top-level). To move a category between parents,
  // delete it from one + create in the other.
  // Find out if this row is itself a subcategory so we can skip the
  // children logic entirely (subs can't have subs).
  const me = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { parentId: true },
  });
  if (!me) {
    return { ok: false, error: "קטגוריה לא נמצאה" };
  }
  const isSubcategory = me.parentId !== null;

  try {
    // Reconcile children (top-level only) — compute create / update /
    // delete sets BEFORE the transaction so we can return a clean error
    // if a delete-candidate still has products.
    const currentChildren = isSubcategory
      ? []
      : await prisma.category.findMany({
          where: { parentId: categoryId },
          select: { id: true },
        });
    const currentIds = new Set(currentChildren.map((c) => c.id));
    const effectiveChildren = isSubcategory ? [] : children;
    const submittedIds = new Set(
      effectiveChildren.filter((c) => c.id).map((c) => c.id!),
    );
    const toDelete = [...currentIds].filter((id) => !submittedIds.has(id));

    if (toDelete.length > 0) {
      const blocking = await prisma.product.findMany({
        where: { categoryId: { in: toDelete } },
        select: { categoryId: true },
      });
      if (blocking.length > 0) {
        return {
          ok: false,
          error: `אי-אפשר להסיר תת-קטגוריה שיש בה מוצרים. העבירו את המוצרים קודם.`,
        };
      }
    }

    await prisma.$transaction(async (tx) => {
      // Update the category itself — parentId NOT touched
      await tx.category.update({
        where: { id: categoryId },
        data: {
          slug: parsed.data.slug,
          name: parsed.data.name,
          nameEn: parsed.data.nameEn,
          cta: parsed.data.cta,
          image: parsed.data.image ?? null,
          description: parsed.data.description,
          seoTitle: parsed.data.seoTitle,
          seoDescription: parsed.data.seoDescription,
          sortOrder: parsed.data.sortOrder,
          isActive: parsed.data.isActive,
        },
      });

      if (isSubcategory) return;

      // Delete children that were removed in the form
      if (toDelete.length > 0) {
        await tx.category.deleteMany({ where: { id: { in: toDelete } } });
      }

      // Upsert remaining children — preserve order via sortOrder = i
      for (let i = 0; i < effectiveChildren.length; i++) {
        const c = effectiveChildren[i];
        if (c.id) {
          await tx.category.update({
            where: { id: c.id },
            data: {
              name: c.name,
              nameEn: c.nameEn,
              slug: c.slug,
              sortOrder: i,
              parentId: categoryId,
            },
          });
        } else {
          await tx.category.create({
            data: {
              name: c.name,
              nameEn: c.nameEn,
              slug: c.slug,
              sortOrder: i,
              parentId: categoryId,
            },
          });
        }
      }
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "שגיאה בעדכון" };
  }
  revalidatePath("/admin/categories");
  revalidatePath(`/category/${parsed.data.slug}`);
  redirect("/admin/categories");
}

/* ────────────── Delete ────────────── */

/**
 * Persist a new order for top-level categories. The order in the array
 * becomes each category's sortOrder. Called by drag-and-drop UI in
 * /admin/categories — the table sends the new top-level order after
 * the user finishes dragging.
 *
 * Subcategory ordering is managed elsewhere (parent's edit form).
 */
export async function reorderTopLevelCategories(orderedIds: string[]): Promise<{
  ok: boolean;
  error?: string;
}> {
  await assertAdmin();
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return { ok: false, error: "רשימה ריקה" };
  }
  // Safety: confirm every id we got is actually top-level. Prevents the
  // client from accidentally reordering subcategories into top-level
  // sortOrder space (which wouldn't be wrong, just surprising).
  const rows = await prisma.category.findMany({
    where: { id: { in: orderedIds } },
    select: { id: true, parentId: true },
  });
  if (rows.length !== orderedIds.length) {
    return { ok: false, error: "חלק מהקטגוריות לא נמצאו" };
  }
  const nonTopLevel = rows.filter((r) => r.parentId !== null);
  if (nonTopLevel.length > 0) {
    return {
      ok: false,
      error: "אחת מהקטגוריות שניסית לסדר היא תת-קטגוריה — סדרי אותה דרך עריכת ההורה.",
    };
  }
  try {
    await prisma.$transaction(
      orderedIds.map((id, idx) =>
        prisma.category.update({
          where: { id },
          data: { sortOrder: idx },
        }),
      ),
    );
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "שגיאה בעדכון סדר" };
  }
  revalidatePath("/admin/categories");
  return { ok: true };
}

export async function deleteCategory(categoryId: string) {
  await assertAdmin();
  try {
    // Block delete if this category OR any of its subcategories has products
    const subIds = (
      await prisma.category.findMany({
        where: { parentId: categoryId },
        select: { id: true },
      })
    ).map((c) => c.id);
    const allIds = [categoryId, ...subIds];
    const productCount = await prisma.product.count({
      where: { categoryId: { in: allIds } },
    });
    if (productCount > 0) {
      return {
        ok: false,
        error: `יש ${productCount} מוצרים בקטגוריה (או בתתי-הקטגוריות שלה). העבירו או מחקו אותם קודם.`,
      };
    }
    // Delete children first (FK), then the parent
    if (subIds.length > 0) {
      await prisma.category.deleteMany({ where: { id: { in: subIds } } });
    }
    await prisma.category.delete({ where: { id: categoryId } });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "שגיאה במחיקה" };
  }
  revalidatePath("/admin/categories");
  return { ok: true };
}
