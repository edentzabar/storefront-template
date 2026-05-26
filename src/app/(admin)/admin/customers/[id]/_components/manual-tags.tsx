"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addUserTag, removeUserTag } from "@/lib/admin/users-actions";

export function ManualTags({
  userId,
  initialTags,
}: {
  userId: string;
  initialTags: string[];
}) {
  const [tags, setTags] = useState(initialTags);
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const value = input.trim();
    if (!value) return;
    startTransition(async () => {
      const result = await addUserTag(userId, value);
      if (result.ok) {
        setTags((prev) => [...prev, value]);
        setInput("");
        setAdding(false);
      } else {
        toast.error(result.error ?? "שגיאה");
      }
    });
  }

  function handleRemove(tag: string) {
    startTransition(async () => {
      const result = await removeUserTag(userId, tag);
      if (result.ok) {
        setTags((prev) => prev.filter((t) => t !== tag));
      } else {
        toast.error(result.error ?? "שגיאה");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((t) => (
        <Badge
          key={t}
          variant="outline"
          className="text-[10px] font-medium border border-brand-accent/30 bg-brand-bg-soft dark:bg-muted text-foreground pl-1.5 pr-2 gap-1"
        >
          {t}
          <button
            type="button"
            onClick={() => handleRemove(t)}
            disabled={pending}
            className="inline-flex items-center justify-center size-3.5 rounded-full hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
            aria-label={`הסר תיוג ${t}`}
          >
            <X className="size-2.5" />
          </button>
        </Badge>
      ))}
      {adding ? (
        <form onSubmit={handleAdd} className="inline-flex items-center gap-1">
          <Input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onBlur={() => {
              if (!input.trim()) setAdding(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setAdding(false);
                setInput("");
              }
            }}
            placeholder="הקלד תיוג..."
            className="h-6 px-2 text-[11px] w-32"
            maxLength={24}
            disabled={pending}
          />
        </form>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => setAdding(true)}
          className="h-6 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
        >
          <Plus className="size-3" />
          הוסף תיוג
        </Button>
      )}
    </div>
  );
}
