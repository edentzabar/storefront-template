"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { UserRole } from "@prisma/client";
import { updateUserRole } from "@/lib/admin/users-actions";

export function RoleSelector({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: UserRole;
}) {
  const [role, setRole] = useState<UserRole>(currentRole);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await updateUserRole(userId, role);
      if (result?.ok) toast.success("התפקיד עודכן");
      else {
        toast.error(result?.error ?? "שגיאה בעדכון");
        setRole(currentRole);
      }
    });
  }

  const changed = role !== currentRole;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setRole("customer")}
          className={`flex-1 px-3 py-2 text-sm border transition-colors ${
            role === "customer"
              ? "bg-brand-primary text-white border-brand-primary"
              : "border-brand-border hover:border-brand-text"
          }`}
        >
          לקוח
        </button>
        <button
          type="button"
          onClick={() => setRole("admin")}
          className={`flex-1 px-3 py-2 text-sm border transition-colors ${
            role === "admin"
              ? "bg-brand-accent text-white border-brand-accent"
              : "border-brand-border hover:border-brand-text"
          }`}
        >
          מנהל
        </button>
      </div>
      <button
        onClick={handleSave}
        disabled={!changed || pending}
        className="w-full px-4 py-2.5 bg-brand-primary text-white text-[0.78rem] tracking-[0.15em] uppercase font-medium hover:bg-brand-primary-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? "מעדכן…" : "שמור"}
      </button>
    </div>
  );
}
