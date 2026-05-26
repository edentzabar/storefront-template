"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { PopupCampaign } from "@prisma/client";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Pencil, Trash2, Eye, MousePointer2, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import { deletePopup, togglePopupActive } from "@/lib/admin/popups-actions";

const TRIGGER_LABELS: Record<string, string> = {
  delay: "השהיה",
  exit_intent: "Exit intent",
  scroll: "גלילה",
};

const PAGE_LABELS: Record<string, string> = {
  all: "כל הדפים",
  home: "דף הבית",
  product: "עמודי מוצר",
  category: "עמודי קטגוריה",
};

export function PopupsTable({ popups }: { popups: PopupCampaign[] }) {
  const [pending, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<PopupCampaign | null>(null);

  function handleToggle(p: PopupCampaign) {
    startTransition(async () => {
      const r = await togglePopupActive(p.id, !p.isActive);
      if (r.ok) toast.success(p.isActive ? "הפופאפ הושבת" : "הפופאפ הופעל");
    });
  }

  function handleDelete() {
    if (!toDelete) return;
    startTransition(async () => {
      const r = await deletePopup(toDelete.id);
      if (r.ok) toast.success(`${toDelete.name} נמחק`);
      else toast.error(r.error ?? "שגיאה");
      setToDelete(null);
    });
  }

  if (popups.length === 0) {
    return (
      <div className="text-center py-16 bg-card border border-border rounded-lg text-muted-foreground">
        אין עדיין פופאפים.{" "}
        <Link href="/admin/popups/new" className="text-brand-accent hover:underline">
          צרו את הראשון
        </Link>
        .
      </div>
    );
  }

  return (
    <>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-right font-medium">שם</th>
              <th className="px-4 py-3 text-right font-medium hidden md:table-cell">
                טריגר
              </th>
              <th className="px-4 py-3 text-right font-medium hidden lg:table-cell">
                דפים
              </th>
              <th className="px-4 py-3 text-right font-medium hidden sm:table-cell">
                ביצועים
              </th>
              <th className="px-4 py-3 text-right font-medium">פעיל</th>
              <th className="px-4 py-3 text-left font-medium w-24">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {popups.map((p) => {
              const ctr = p.impressions > 0 ? (p.clicks / p.impressions) * 100 : 0;
              const expired = p.endsAt && p.endsAt < new Date();
              return (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 align-middle">
                    <div className="font-medium text-sm">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate max-w-[280px]">
                      {p.title}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-middle hidden md:table-cell text-sm text-muted-foreground">
                    {TRIGGER_LABELS[p.triggerType]}
                    {(p.triggerType === "delay" || p.triggerType === "scroll") && (
                      <span className="text-[11px] tabular-nums">
                        {" · "}
                        {p.triggerValue}
                        {p.triggerType === "scroll" ? "%" : "s"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-middle hidden lg:table-cell text-sm text-muted-foreground">
                    {PAGE_LABELS[p.pageTarget]}
                  </td>
                  <td className="px-4 py-3 align-middle hidden sm:table-cell">
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Eye className="size-3" />
                        {p.impressions}
                      </span>
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <MousePointer2 className="size-3" />
                        {p.clicks}
                      </span>
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <X className="size-3" />
                        {p.closes}
                      </span>
                    </div>
                    {p.impressions > 0 && (
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        CTR: <span className="tabular-nums">{ctr.toFixed(1)}%</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={p.isActive && !expired}
                        onCheckedChange={() => handleToggle(p)}
                        disabled={pending || Boolean(expired)}
                      />
                      {expired && (
                        <Badge variant="outline" className="text-[10px] bg-muted">
                          פג תוקף
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center gap-1 justify-end">
                      <Link
                        href={`/admin/popups/${p.id}/edit`}
                        className="inline-flex items-center justify-center size-8 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="ערוך"
                      >
                        <Pencil className="size-4" />
                      </Link>
                      <button
                        onClick={() => setToDelete(p)}
                        disabled={pending}
                        className="inline-flex items-center justify-center size-8 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
                        title="מחק"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת פופאפ</AlertDialogTitle>
            <AlertDialogDescription>
              למחוק את &quot;{toDelete?.name}&quot;? הסטטיסטיקה תאבד גם כן.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
