import "server-only";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getClientIp } from "@/lib/rate-limit";

/**
 * Write one row to the audit log. Call this from any admin action that
 * mutates state. Failures here MUST NOT fail the action itself — we
 * catch + swallow + log to console. A missing audit entry is far less
 * bad than refusing to save a real change.
 *
 * Usage:
 *   await audit("product:create", "product", newProduct.id, { after: newProduct });
 *   await audit("order:status:update", "order", id, { before: { status: old }, after: { status: next } });
 *   await audit("coupon:delete", "coupon", id, { before: oldCoupon });
 *
 * The action slug is convention-only — no enum — to keep new admin
 * actions cheap to add. Stick to `resource:verb` or `resource:sub:verb`
 * so the log is easy to filter.
 */
export async function audit(
  action: string,
  resourceType: string,
  resourceId: string | null,
  opts: { before?: unknown; after?: unknown } = {},
): Promise<void> {
  try {
    const me = await getCurrentUser();
    let ip: string | null = null;
    try {
      ip = await getClientIp();
    } catch {
      // headers() isn't available in some server contexts (e.g. CLI scripts);
      // leave ip null in that case.
    }
    await prisma.auditLog.create({
      data: {
        userId: me?.id ?? null,
        action,
        resourceType,
        resourceId,
        before: (opts.before as object | undefined) ?? undefined,
        after: (opts.after as object | undefined) ?? undefined,
        ip,
      },
    });
  } catch (err) {
    // Don't throw — never block a real mutation because logging failed.
    // eslint-disable-next-line no-console
    console.error("[audit] failed to write log:", err);
  }
}
