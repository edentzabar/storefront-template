"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateUserNotes } from "@/lib/admin/users-actions";

export function InternalNotes({
  userId,
  initialNotes,
}: {
  userId: string;
  initialNotes: string | null;
}) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [pending, startTransition] = useTransition();
  const dirty = notes !== (initialNotes ?? "");

  function handleSave() {
    startTransition(async () => {
      const result = await updateUserNotes(userId, notes.trim() || null);
      if (result.ok) toast.success("הערות נשמרו");
      else toast.error(result.error ?? "שגיאה");
    });
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="הערות פנימיות על הלקוח — שיחה שהייתה, העדפות, מידע שעוזר לצוות..."
        className="min-h-[100px] text-sm resize-none"
        maxLength={4000}
      />
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-muted-foreground">
          {notes.length}/4000 · גלוי רק לאדמינים
        </div>
        {dirty && (
          <Button
            size="sm"
            onClick={handleSave}
            disabled={pending}
            className="h-7 gap-1.5"
          >
            <Save className="size-3.5" />
            {pending ? "שומר..." : "שמור"}
          </Button>
        )}
      </div>
    </div>
  );
}
