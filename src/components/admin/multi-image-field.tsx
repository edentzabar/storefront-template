"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Upload, X, Loader2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/lib/admin/upload-actions";

/**
 * Multi-image gallery uploader. Maintains an ordered list of image URLs.
 * Reports the list back via `onChange`. Designed to slot into existing forms
 * that submit the value as a newline-joined string (use the `name` prop —
 * a hidden input mirrors the current list for native form submission).
 */
export function MultiImageField({
  label,
  value,
  onChange,
  name,
  purpose,
  help,
}: {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  /** If set, renders a hidden textarea with this name containing the joined value */
  name?: string;
  purpose: string;
  help?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function handleFiles(files: FileList) {
    startTransition(async () => {
      const next = [...value];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("purpose", purpose);
        const result = await uploadImage(formData);
        if (result.ok && result.url) {
          next.push(result.url);
        } else {
          toast.error(result.error ?? `שגיאה בהעלאת ${file.name}`);
        }
      }
      onChange(next);
      if (next.length > value.length) toast.success(`הועלו ${next.length - value.length} תמונות`);
    });
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function moveItem(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= value.length || to >= value.length) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
        {label}
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((url, i) => (
          <div
            key={`${url}-${i}`}
            draggable
            onDragStart={() => setDragIndex(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIndex !== null) moveItem(dragIndex, i);
              setDragIndex(null);
            }}
            className="group relative size-20 rounded-md overflow-hidden border border-border bg-muted/40 cursor-move"
          >
            <Image
              src={url}
              alt=""
              fill
              sizes="80px"
              className="object-cover"
              unoptimized={url.startsWith("http") && !url.includes("vercel-storage.com")}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-1 left-1 size-5 rounded-full bg-foreground/80 text-background grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="הסר"
            >
              <X className="size-3" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-foreground/70 text-background text-[10px] py-0.5 px-1 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="size-3" />
              <span className="tabular-nums">{i + 1}</span>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className="size-20 rounded-md border-2 border-dashed border-border hover:border-foreground/40 grid place-items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          {pending ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
        </button>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
        >
          {pending ? "מעלה..." : "+ הוספת תמונות"}
        </Button>
        {value.length > 0 && (
          <span>
            {value.length} תמונות · גרור לסידור מחדש · רחף וקליק X להסרה
          </span>
        )}
      </div>

      {help && <p className="text-[11px] text-muted-foreground mt-1.5">{help}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {name && (
        <textarea
          name={name}
          value={value.join("\n")}
          readOnly
          hidden
          className="hidden"
        />
      )}
    </div>
  );
}
