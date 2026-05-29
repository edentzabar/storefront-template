"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Pencil,
  Trash2,
  ChevronDown,
  ChevronLeft,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import type { Prisma } from "@prisma/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  deleteCategory,
  reorderTopLevelCategories,
} from "@/lib/admin/categories-actions";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type CategoryRow = Prisma.CategoryGetPayload<{
  include: { _count: { select: { products: true } } };
}>;

/** What the page passes us — base row + the computed product counts. */
export type CategoryRowWithAggregate = CategoryRow & {
  /** Direct products on this category + products in all its subcategories */
  aggregateProductCount: number;
  /** Just the subcategory total (so we can show "X (Y בתתים)" on parents) */
  childrenProductCount: number;
};

export function CategoriesTable({
  categories,
}: {
  categories: CategoryRowWithAggregate[];
}) {
  const [pending, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<CategoryRowWithAggregate | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Build lookup maps from props
  const byId = useMemo(() => {
    const m = new Map<string, CategoryRowWithAggregate>();
    for (const c of categories) m.set(c.id, c);
    return m;
  }, [categories]);

  const childrenByParent = useMemo(() => {
    const m = new Map<string, CategoryRowWithAggregate[]>();
    for (const c of categories) {
      if (c.parentId) {
        const arr = m.get(c.parentId) ?? [];
        arr.push(c);
        m.set(c.parentId, arr);
      }
    }
    return m;
  }, [categories]);

  const propsTopLevelIds = useMemo(
    () => categories.filter((c) => c.parentId === null).map((c) => c.id),
    [categories],
  );

  // Local copy of the top-level order, for optimistic drag updates.
  // Sync to props whenever the server-side order changes (after a save
  // commits and revalidation pushes fresh data down).
  const [topLevelOrder, setTopLevelOrder] = useState<string[]>(propsTopLevelIds);
  useEffect(() => {
    setTopLevelOrder(propsTopLevelIds);
  }, [propsTopLevelIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const parentsWithChildren = useMemo(
    () => new Set(childrenByParent.keys()),
    [childrenByParent],
  );
  const allExpanded =
    parentsWithChildren.size > 0 &&
    [...parentsWithChildren].every((id) => expanded.has(id));

  function toggleParent(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setExpanded(allExpanded ? new Set() : new Set(parentsWithChildren));
  }

  // DnD
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = topLevelOrder.indexOf(active.id as string);
    const newIndex = topLevelOrder.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(topLevelOrder, oldIndex, newIndex);
    setTopLevelOrder(next); // optimistic
    startTransition(async () => {
      const result = await reorderTopLevelCategories(next);
      if (!result.ok) {
        toast.error(result.error ?? "שגיאה בשמירת הסדר");
        // revert on failure
        setTopLevelOrder(propsTopLevelIds);
      }
    });
  }

  function confirmDelete() {
    if (!toDelete) return;
    startTransition(async () => {
      const result = await deleteCategory(toDelete.id);
      if (result?.ok) toast.success(`${toDelete.name} נמחקה`);
      else toast.error(result?.error ?? "שגיאה במחיקה");
      setToDelete(null);
    });
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-16 bg-card border border-border rounded-lg text-muted-foreground">
        אין עדיין קטגוריות.{" "}
        <Link
          href="/admin/categories/new"
          className="text-brand-accent hover:underline"
        >
          צרו את הראשונה
        </Link>
        .
      </div>
    );
  }

  return (
    <>
      {parentsWithChildren.size > 0 && (
        <div className="flex justify-end mb-3">
          <button
            onClick={toggleAll}
            className="inline-flex items-center gap-1.5 text-[0.78rem] font-medium px-3 py-1.5 rounded-md border border-border bg-card hover:bg-muted transition-colors"
            type="button"
          >
            {allExpanded ? (
              <>
                <ChevronDown className="size-3.5" />
                סגור הכל
              </>
            ) : (
              <>
                <ChevronLeft className="size-3.5" />
                פתח הכל
              </>
            )}
          </button>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              {/* drag-handle column */}
              <th className="px-2 py-3 w-8"></th>
              {/* expand-collapse column */}
              <th className="px-2 py-3 w-8"></th>
              <th className="px-4 py-3 text-right font-medium">תמונה</th>
              <th className="px-4 py-3 text-right font-medium">שם</th>
              <th className="px-4 py-3 text-right font-medium hidden sm:table-cell">מוצרים</th>
              <th className="px-4 py-3 text-right font-medium">סטטוס</th>
              <th className="px-4 py-3 text-left font-medium w-24">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={topLevelOrder}
                strategy={verticalListSortingStrategy}
              >
                {topLevelOrder.map((id) => {
                  const top = byId.get(id);
                  if (!top) return null;
                  const kids = childrenByParent.get(id) ?? [];
                  const isOpen = expanded.has(id);
                  return (
                    <TopLevelRow
                      key={id}
                      category={top}
                      hasChildren={kids.length > 0}
                      isOpen={isOpen}
                      onToggle={() => toggleParent(id)}
                      onDelete={() => setToDelete(top)}
                      deleting={pending}
                    >
                      {/* Subcategory rows render only when parent is expanded */}
                      {isOpen &&
                        kids.map((sub) => (
                          <SubcategoryRow
                            key={sub.id}
                            category={sub}
                            onDelete={() => setToDelete(sub)}
                            deleting={pending}
                          />
                        ))}
                    </TopLevelRow>
                  );
                })}
              </SortableContext>
            </DndContext>
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת קטגוריה</AlertDialogTitle>
            <AlertDialogDescription>
              למחוק את &quot;{toDelete?.name}&quot;? פעולה זו לא ניתנת לביטול.
              {toDelete && toDelete._count.products > 0 && (
                <span className="block mt-2 text-destructive">
                  ⚠ יש {toDelete._count.products} מוצרים בקטגוריה. צריך להעבירם או למחוק אותם קודם.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {pending ? "מוחק…" : "מחק"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ────────────────────── Row components ────────────────────── */

/**
 * Top-level category row — draggable via the grip handle. Renders as a
 * fragment that includes itself plus any visible subcategory rows
 * (passed in as children) so that expand-state appears inline below.
 */
function TopLevelRow({
  category: c,
  hasChildren,
  isOpen,
  onToggle,
  onDelete,
  deleting,
  children,
}: {
  category: CategoryRowWithAggregate;
  hasChildren: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onDelete: () => void;
  deleting: boolean;
  children?: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: c.id });

  return (
    <>
      <tr
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0.4 : 1,
        }}
        className={cn(
          "hover:bg-muted/30 transition-colors",
          isDragging && "bg-card shadow-md ring-2 ring-brand-accent/30",
        )}
      >
        <td className="px-2 py-3 align-middle text-center">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="size-7 inline-grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-grab active:cursor-grabbing touch-none"
            title="גרור לשינוי סדר"
            aria-label="שינוי סדר"
          >
            <GripVertical className="size-4" />
          </button>
        </td>
        <td className="px-2 py-3 align-middle text-center">
          {hasChildren && (
            <button
              type="button"
              onClick={onToggle}
              className="size-6 inline-grid place-items-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label={isOpen ? "סגור" : "פתח"}
              aria-expanded={isOpen}
            >
              {isOpen ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronLeft className="size-4" />
              )}
            </button>
          )}
        </td>
        <CommonRowCells category={c} onDelete={onDelete} deleting={deleting} />
      </tr>
      {children}
    </>
  );
}

/** Plain row for subcategories — no drag handle (reorder them via the
 *  parent's edit form). Indented + flagged with a "תת-קטגוריה" chip. */
function SubcategoryRow({
  category: c,
  onDelete,
  deleting,
}: {
  category: CategoryRowWithAggregate;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <tr className="hover:bg-muted/30 transition-colors bg-muted/10">
      <td className="px-2 py-3" />
      <td className="px-2 py-3" />
      <CommonRowCells category={c} onDelete={onDelete} deleting={deleting} />
    </tr>
  );
}

/** Image / name / products / status / actions cells — shared so both
 *  top-level rows and subcategory rows render identically beyond the
 *  drag/expand columns. */
function CommonRowCells({
  category: c,
  onDelete,
  deleting,
}: {
  category: CategoryRowWithAggregate;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <>
      <td className="px-4 py-3 align-middle">
        <div className="relative size-12 overflow-hidden rounded-md bg-muted">
          {c.image && (
            <Image
              src={c.image}
              alt={c.name}
              fill
              sizes="48px"
              className="object-cover"
            />
          )}
        </div>
      </td>
      <td className="px-4 py-3 align-middle">
        <div
          className={cn(
            "flex items-center gap-2",
            c.parentId && "ps-6",
          )}
        >
          {c.parentId && (
            <span className="text-muted-foreground text-xs select-none">↳</span>
          )}
          <div>
            <Link
              href={`/admin/categories/${c.id}/edit`}
              className="font-medium text-foreground hover:text-brand-accent transition-colors no-underline"
            >
              {c.name}
            </Link>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {c.nameEn}
              {c.parentId && (
                <span className="ms-2 inline-block bg-muted px-1.5 py-0.5 rounded text-[10px]">
                  תת-קטגוריה
                </span>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 align-middle hidden sm:table-cell text-sm">
        <span className="tabular-nums text-foreground">
          {c.aggregateProductCount}
        </span>
        {c.childrenProductCount > 0 && (
          <span
            className="block text-[10px] text-muted-foreground tabular-nums"
            title={`${c._count.products} ישירות, ${c.childrenProductCount} בתתי-קטגוריות`}
          >
            {c._count.products === 0
              ? `(${c.childrenProductCount} בתתים)`
              : `(${c._count.products} ישיר · ${c.childrenProductCount} בתתים)`}
          </span>
        )}
      </td>
      <td className="px-4 py-3 align-middle">
        <Badge
          variant="secondary"
          className={cn(
            "text-[10px] px-2 py-0.5 font-medium border-0",
            c.isActive
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              : "bg-muted text-muted-foreground",
          )}
        >
          {c.isActive ? "פעיל" : "מוסתר"}
        </Badge>
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center gap-1 justify-end">
          <Link
            href={`/admin/categories/${c.id}/edit`}
            className="inline-flex items-center justify-center size-8 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="ערוך"
          >
            <Pencil className="size-4" />
          </Link>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="inline-flex items-center justify-center size-8 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
            title="מחק"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </td>
    </>
  );
}
