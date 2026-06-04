import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, isEmailConfigured } from "@/lib/email/client";
import { abandonedCartEmail } from "@/lib/email/abandoned-cart-template";
import { siteConfig } from "@/lib/site-config";
import { signToken } from "@/lib/tokens";

/**
 * Vercel Cron — runs hourly to email customers whose carts have been
 * inactive for at least 60 minutes and who haven't been reminded yet.
 *
 * Protected by CRON_SECRET (set in Vercel env vars). Vercel automatically
 * sets Authorization: Bearer <CRON_SECRET> when invoking via the cron config.
 *
 * Configure schedule in vercel.json.
 */
export async function GET(req: Request) {
  // Authorize: in production require CRON_SECRET; in dev allow without (for manual testing).
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!isEmailConfigured()) {
    return NextResponse.json({
      ok: true,
      skipped: "Email not configured (RESEND_API_KEY missing)",
      sent: 0,
    });
  }

  const cutoff = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
  const ttl = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000); // 2 weeks (don't email very old carts)

  const candidates = await prisma.abandonedCart.findMany({
    where: {
      reminderSentAt: null,
      recoveredAt: null,
      updatedAt: { lte: cutoff, gte: ttl },
    },
    take: 50, // safety cap per run
  });

  let sent = 0;
  const failures: { id: string; reason: string }[] = [];

  for (const cart of candidates) {
    try {
      // SECURITY: Sign a fresh HMAC token instead of embedding the
      // raw cuid `recoveryToken` from the DB. Two benefits:
      //   • Stateless — verifier doesn't need to query the DB row
      //     by token, just verify the signature and read cartId.
      //   • Time-bounded — token auto-expires after 14 days, matching
      //     the cart's own TTL above. Leaked link past expiry is dead.
      // The /api/cart/recover route accepts BOTH formats (signed +
      // legacy cuid) for backwards compat, so old emails in flight
      // still work.
      const token = signToken(
        { cartId: cart.id },
        14 * 24 * 60 * 60_000,
      );
      const recoveryUrl = `${siteConfig.url}/cart?recover=${encodeURIComponent(token)}`;
      const tpl = abandonedCartEmail({
        customerName: cart.customerName,
        items: cart.items as unknown as Parameters<typeof abandonedCartEmail>[0]["items"],
        subtotal: cart.subtotal,
        recoveryUrl,
      });
      const result = await sendEmail({
        to: cart.email,
        subject: tpl.subject,
        html: tpl.html,
      });
      if (result.ok) {
        await prisma.abandonedCart.update({
          where: { id: cart.id },
          data: { reminderSentAt: new Date() },
        });
        sent++;
      } else if (!result.skipped) {
        failures.push({ id: cart.id, reason: result.error });
      }
    } catch (err) {
      failures.push({
        id: cart.id,
        reason: err instanceof Error ? err.message : "unknown",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    eligible: candidates.length,
    failures,
  });
}
