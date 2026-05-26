"use client";

import { useState, useTransition } from "react";
import { Save, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  updateOrderTracking,
  updateOrderInternalNotes,
} from "@/lib/admin/orders-actions";

export function OrderTrackingEditor({
  orderId,
  initialTracking,
}: {
  orderId: string;
  initialTracking: string | null;
}) {
  const [tracking, setTracking] = useState(initialTracking ?? "");
  const [pending, startTransition] = useTransition();
  const dirty = tracking.trim() !== (initialTracking ?? "");

  function save() {
    startTransition(async () => {
      const r = await updateOrderTracking(orderId, tracking.trim() || null);
      if (r.ok) toast.success("מספר מעקב נשמר");
      else toast.error(r.error ?? "שגיאה");
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Truck className="size-3.5" />
        מספר מעקב משלוח
      </div>
      <div className="flex gap-2">
        <Input
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          placeholder="EE123456789IL"
          className="h-8 font-mono text-sm"
          maxLength={120}
        />
        {dirty && (
          <Button onClick={save} disabled={pending} size="sm" className="h-8 gap-1.5">
            <Save className="size-3.5" />
            {pending ? "..." : "שמור"}
          </Button>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground">
        ייכלל במייל לעדכון סטטוס שנשלח כשמסמנים &quot;נשלחה&quot;.
      </p>
    </div>
  );
}

export function OrderInternalNotesEditor({
  orderId,
  initialNotes,
}: {
  orderId: string;
  initialNotes: string | null;
}) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [pending, startTransition] = useTransition();
  const dirty = notes.trim() !== (initialNotes ?? "");

  function save() {
    startTransition(async () => {
      const r = await updateOrderInternalNotes(orderId, notes.trim() || null);
      if (r.ok) toast.success("הערות נשמרו");
      else toast.error(r.error ?? "שגיאה");
    });
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="הערות פנימיות לצוות — אריזה מיוחדת, הערה ללקוח, וכו'."
        className="min-h-[90px] text-sm resize-none"
        maxLength={4000}
      />
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-muted-foreground">
          {notes.length}/4000 · גלוי רק לאדמינים
        </div>
        {dirty && (
          <Button onClick={save} disabled={pending} size="sm" className="h-7 gap-1.5">
            <Save className="size-3.5" />
            {pending ? "שומר..." : "שמור"}
          </Button>
        )}
      </div>
    </div>
  );
}
