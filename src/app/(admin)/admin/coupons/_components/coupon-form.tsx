"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { Coupon } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCoupon, updateCoupon } from "@/lib/admin/coupons-actions";
import { format } from "date-fns";

export function CouponForm({ coupon }: { coupon?: Coupon | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [code, setCode] = useState(coupon?.code ?? "");
  const [description, setDescription] = useState(coupon?.description ?? "");
  const [type, setType] = useState<"percent" | "amount">(coupon?.type ?? "percent");
  const [value, setValue] = useState(String(coupon?.value ?? ""));
  const [minSubtotal, setMinSubtotal] = useState(
    String(coupon?.minSubtotal ?? 0),
  );
  const [maxUses, setMaxUses] = useState(coupon?.maxUses ? String(coupon.maxUses) : "");
  const [expiresAt, setExpiresAt] = useState(
    coupon?.expiresAt ? format(coupon.expiresAt, "yyyy-MM-dd") : "",
  );
  const [isActive, setIsActive] = useState(coupon?.isActive ?? true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const input = {
        code: code.toUpperCase().trim(),
        description,
        type,
        value: Number(value),
        minSubtotal: Number(minSubtotal) || 0,
        maxUses: maxUses ? Number(maxUses) : null,
        expiresAt: expiresAt || null,
        isActive,
      };
      const result = coupon
        ? await updateCoupon(coupon.id, input)
        : await createCoupon(input);
      if (result.ok) {
        toast.success(coupon ? "הקופון עודכן" : "הקופון נוצר");
        router.push("/admin/coupons");
      } else {
        toast.error(result.error ?? "שגיאה");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-[720px]">
      <section className="bg-card border border-border rounded-lg p-5 md:p-6 space-y-5">
        <div>
          <Label htmlFor="code" className="text-xs uppercase tracking-wider text-muted-foreground">
            קוד הקופון *
          </Label>
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="WELCOME10"
            required
            maxLength={40}
            className="mt-1.5 font-mono uppercase"
          />
          <p className="text-[11px] text-muted-foreground mt-1.5">
            אותיות באנגלית, ספרות, _ ו--. הלקוח יקליד את זה בעגלה.
          </p>
        </div>

        <div>
          <Label htmlFor="description" className="text-xs uppercase tracking-wider text-muted-foreground">
            תיאור פנימי
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="למה הקופון הזה קיים? לאיזה קמפיין?"
            rows={2}
            maxLength={200}
            className="mt-1.5"
          />
        </div>
      </section>

      <section className="bg-card border border-border rounded-lg p-5 md:p-6 space-y-5">
        <h3 className="text-sm font-medium">הנחה</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              סוג *
            </Label>
            <Select value={type} onValueChange={(v) => setType(v as "percent" | "amount")}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">אחוז הנחה (%)</SelectItem>
                <SelectItem value="amount">סכום קבוע (₪)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="value" className="text-xs uppercase tracking-wider text-muted-foreground">
              ערך *
            </Label>
            <Input
              id="value"
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={type === "percent" ? "10" : "50"}
              min={1}
              max={type === "percent" ? 100 : undefined}
              required
              className="mt-1.5 tabular-nums"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              {type === "percent" ? "אחוז (1-100)" : "סכום בשקלים — יורד מהעגלה"}
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="minSubtotal" className="text-xs uppercase tracking-wider text-muted-foreground">
            מינימום הזמנה
          </Label>
          <Input
            id="minSubtotal"
            type="number"
            value={minSubtotal}
            onChange={(e) => setMinSubtotal(e.target.value)}
            placeholder="0"
            min={0}
            className="mt-1.5 tabular-nums"
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            מינימום סכום עגלה (₪) שמאפשר את הקופון. 0 = ללא מינימום.
          </p>
        </div>
      </section>

      <section className="bg-card border border-border rounded-lg p-5 md:p-6 space-y-5">
        <h3 className="text-sm font-medium">מגבלות</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="maxUses" className="text-xs uppercase tracking-wider text-muted-foreground">
              מספר שימושים מקסימלי
            </Label>
            <Input
              id="maxUses"
              type="number"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="ללא הגבלה"
              min={1}
              className="mt-1.5 tabular-nums"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              השאר ריק לשימוש בלתי מוגבל.
            </p>
          </div>
          <div>
            <Label htmlFor="expiresAt" className="text-xs uppercase tracking-wider text-muted-foreground">
              תוקף עד
            </Label>
            <Input
              id="expiresAt"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="mt-1.5"
            />
            <p className="text-[11px] text-muted-foreground mt-1">השאר ריק לתוקף קבוע.</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div>
            <Label className="text-sm">פעיל</Label>
            <p className="text-[11px] text-muted-foreground">לקוחות יכולים להזין את הקוד בעגלה</p>
          </div>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>
      </section>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/admin/coupons")}>
          ביטול
        </Button>
        <Button type="submit" disabled={pending} className="bg-foreground text-background hover:bg-foreground/90">
          {pending ? "שומר..." : coupon ? "שמור שינויים" : "צור קופון"}
        </Button>
      </div>
    </form>
  );
}
