"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { audit } from "@/lib/audit";

/**
 * Delete the currently signed-in user's account.
 *
 * GDPR / Israeli Privacy Protection Law: customers must be able to
 * delete their account on demand. We satisfy this by hard-deleting
 * the User row, which cascades to:
 *   • Session  → deleted (better-auth Cascade)
 *   • Account  → deleted (better-auth Cascade)
 *   • Address  → deleted (Cascade)
 *
 * Orders are NOT deleted. Two reasons:
 *   1. Israeli tax law requires keeping business records for 7 years.
 *      An order is a business record (taxable transaction).
 *   2. Order.userId is nullable + SetNull, so the order survives but
 *      no longer links to a user. The customer's name / email / phone
 *      are stored as separate `customerXxx` columns on the order;
 *      those stay as part of the business record. This is legally
 *      compliant — Israeli ICO guidance allows keeping transaction
 *      records that the customer can no longer access via their
 *      account.
 *
 * AuditLog rows have userId SetNull on delete, so the audit trail
 * survives but no longer points at the deleted user.
 *
 * The caller is expected to sign the user out via the client after
 * this resolves (signOut() in @/lib/auth-client). We can't sign them
 * out from a server action without juggling cookies — easier to let
 * the client handle it.
 */
export type DeleteAccountResult =
  | { ok: true }
  | { ok: false; error: string };

export async function deleteMyAccount(): Promise<DeleteAccountResult> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "לא מחובר" };

  // SECURITY: refuse to delete the last admin account. Otherwise
  // a hijacked admin session could nuke the store's only admin and
  // lock everyone out. The merchant can demote / promote via the
  // make-admin CLI when needed.
  if (me.role === "admin") {
    const adminCount = await prisma.user.count({ where: { role: "admin" } });
    if (adminCount <= 1) {
      return {
        ok: false,
        error: "אי אפשר למחוק את חשבון מנהל החנות היחיד דרך הפרונט. פני אלינו.",
      };
    }
  }

  try {
    await prisma.user.delete({ where: { id: me.id } });
  } catch (err) {
    console.error("[deleteMyAccount] failed:", err);
    return {
      ok: false,
      error: "מחיקת החשבון נכשלה. נסי שוב או פני אלינו.",
    };
  }

  // Best-effort audit log. Writes after the delete so the row records
  // the action with a null userId (SetNull from the cascade above).
  await audit("user:self-delete", "user", me.id, {
    before: { id: me.id, email: me.email, name: me.name, role: me.role },
  });

  return { ok: true };
}
