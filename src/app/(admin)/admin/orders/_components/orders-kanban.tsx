"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { OrderStatus } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { MoreHorizontal, ArrowRightLeft, GripVertical } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { STATUS_LABELS } from "@/lib/admin/order-helpers";
import { bulkUpdateOrderStatus } from "@/lib/admin/orders-actions";
import { cn } from "@/lib/utils";

type Order = {
  id: string;
  status: OrderStatus;
  customerFullName: string;
  customerEmail: string;
  total: number;
  itemsCount: number;
  createdAt: Date;
};

const COLUMNS: { status: OrderStatus; tone: string; bg: string; border: string }[] = [
  {
    status: "new",
    tone: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50/50 dark:bg-amber-950/20",
    border: "ring-amber-400/60",
  },
  {
    status: "processing",
    tone: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50/50 dark:bg-blue-950/20",
    border: "ring-blue-400/60",
  },
  {
    status: "shipped",
    tone: "text-indigo-700 dark:text-indigo-400",
    bg: "bg-indigo-50/50 dark:bg-indigo-950/20",
    border: "ring-indigo-400/60",
  },
  {
    status: "delivered",
    tone: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50/50 dark:bg-emerald-950/20",
    border: "ring-emerald-400/60",
  },
  {
    status: "cancelled",
    tone: "text-rose-700 dark:text-rose-400",
    bg: "bg-rose-50/50 dark:bg-rose-950/20",
    border: "ring-rose-400/60",
  },
];

export function OrdersKanban({ orders }: { orders: Order[] }) {
  const [pending, startTransition] = useTransition();
  // Local copy so drag drops can update the board optimistically. The
  // useState initial value runs once; if the parent re-renders with new
  // data we sync via the key prop on the parent page.
  const [items, setItems] = useState(orders);
  const [activeId, setActiveId] = useState<string | null>(null);

  // PointerSensor with a distance constraint — clicks (no movement)
  // pass through to children so cards stay clickable AND draggable.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  function move(id: string, to: OrderStatus) {
    startTransition(async () => {
      const r = await bulkUpdateOrderStatus([id], to);
      if (r.ok) toast.success(`הועבר ל"${STATUS_LABELS[to]}"`);
      else toast.error(r.error ?? "שגיאה");
    });
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const orderId = String(active.id);
    const newStatus = String(over.id) as OrderStatus;
    const order = items.find((o) => o.id === orderId);
    if (!order || order.status === newStatus) return;

    // Optimistic — flip the card now, server sync in the background.
    setItems((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
    );
    move(orderId, newStatus);
  }

  const activeOrder = activeId ? items.find((o) => o.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3" dir="rtl">
        {COLUMNS.map((col) => {
          const colItems = items.filter((o) => o.status === col.status);
          return (
            <KanbanColumn
              key={col.status}
              status={col.status}
              colors={col}
              count={colItems.length}
              total={colItems.reduce((s, o) => s + o.total, 0)}
            >
              {colItems.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-8">
                  גרור הזמנה לכאן
                </div>
              ) : (
                colItems.map((o) => (
                  <KanbanCard key={o.id} order={o} pending={pending} onMove={move} />
                ))
              )}
            </KanbanColumn>
          );
        })}
      </div>

      <DragOverlay>
        {activeOrder ? (
          <div className="bg-card border border-border rounded-md p-3 shadow-lg rotate-2 opacity-95">
            <div className="font-medium text-sm leading-tight">
              {activeOrder.customerFullName}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              {activeOrder.customerEmail}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

/* ───────────── Column (droppable) ───────────── */

function KanbanColumn({
  status,
  colors,
  count,
  total,
  children,
}: {
  status: OrderStatus;
  colors: (typeof COLUMNS)[number];
  count: number;
  total: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg border border-border flex flex-col min-h-[400px] max-h-[calc(100vh-280px)] transition-shadow",
        colors.bg,
        isOver && `ring-2 ${colors.border} shadow-md`,
      )}
    >
      <div className="px-3 py-2.5 border-b border-border/60 shrink-0">
        <div className="flex items-center justify-between">
          <div className={cn("text-xs font-semibold", colors.tone)}>
            {STATUS_LABELS[status]}
          </div>
          <div className="text-[11px] text-muted-foreground tabular-nums">{count}</div>
        </div>
        {count > 0 && (
          <div className="text-[10px] text-muted-foreground tabular-nums mt-0.5">
            ₪{total.toLocaleString("he-IL")}
          </div>
        )}
      </div>
      <div className="p-2 flex-1 overflow-y-auto space-y-2">{children}</div>
    </div>
  );
}

/* ───────────── Card (draggable + clickable) ───────────── */

function KanbanCard({
  order,
  pending,
  onMove,
}: {
  order: Order;
  pending: boolean;
  onMove: (id: string, to: OrderStatus) => void;
}) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: order.id,
  });

  // Click-anywhere-on-card → navigate. Distance-constrained pointer
  // sensor means a click (no movement) still fires here; only drags
  // (>6px movement) get captured by dnd-kit instead.
  function handleCardClick(e: React.MouseEvent) {
    // Ignore clicks that bubbled up from interactive children
    if ((e.target as HTMLElement).closest("[data-no-card-nav]")) return;
    router.push(`/admin/orders/${order.id}`);
  }

  return (
    <div
      ref={setNodeRef}
      onClick={handleCardClick}
      {...listeners}
      {...attributes}
      className={cn(
        "bg-card border border-border rounded-md p-3 hover:shadow-sm transition-all group cursor-pointer",
        isDragging && "opacity-30",
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-start gap-1.5 flex-1 min-w-0">
          <GripVertical className="size-3.5 text-muted-foreground/40 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="font-medium text-sm leading-tight min-w-0 truncate">
            {order.customerFullName}
          </div>
        </div>
        {/* Marked data-no-card-nav so clicking the menu doesn't also
            navigate to the order detail page. */}
        <div data-no-card-nav onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  disabled={pending}
                  className="-mr-1 -mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="פעולות"
                />
              }
            >
              <MoreHorizontal className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-[10px]">
                  <ArrowRightLeft className="size-3 inline-block ml-1" />
                  העבר לסטטוס
                </DropdownMenuLabel>
                {COLUMNS.filter((c) => c.status !== order.status).map((c) => (
                  <DropdownMenuItem
                    key={c.status}
                    onClick={() => onMove(order.id, c.status)}
                  >
                    {STATUS_LABELS[c.status]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/admin/orders/${order.id}`)}>
                פתח פרטים
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="text-[11px] text-muted-foreground truncate">
        {order.customerEmail}
      </div>
      <div className="flex items-end justify-between mt-2">
        <div className="text-[10px] text-muted-foreground">
          {order.itemsCount} פריטים ·{" "}
          {formatDistanceToNow(order.createdAt, { addSuffix: true, locale: he })}
        </div>
        <div className="text-sm font-semibold tabular-nums">
          ₪{order.total.toLocaleString("he-IL")}
        </div>
      </div>
    </div>
  );
}
