import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp, POLICIES } from "@/lib/rate-limit";
import { verifyToken } from "@/lib/tokens";

/**
 * GET /api/cart/recover?token=xxx
 *
 * Two valid token shapes:
 *   1. NEW (recommended) — an HMAC-signed token issued by the
 *      abandoned-cart email job. Encodes { cartId, exp }. Stateless,
 *      unforgeable, automatically expires.
 *   2. LEGACY — the plain `recoveryToken` cuid stored on the cart row.
 *      Older emails still in the wild. We still accept this BUT only
 *      if the cart hasn't been recovered AND is younger than 14 days.
 *
 * Rate-limited per IP to make token enumeration unprofitable.
 */
export async function GET(req: Request) {
  // SECURITY: brute-force protection on token guessing.
  const ip = await getClientIp();
  const rl = await rateLimit(`cart-recover:${ip}`, POLICIES.metric);
  if (!rl.ok) return NextResponse.json({ error: "rate limited" }, { status: 429 });

  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.json({ error: "missing token" }, { status: 400 });

  // Try HMAC-signed token first.
  let cartId: string | null = null;
  const verified = verifyToken<{ cartId: string; exp: number }>(token);
  if (verified?.cartId) cartId = verified.cartId;

  // Fall back to legacy plain cuid (backwards compat for emails in flight).
  // We additionally enforce a 14-day age cap so leaked legacy tokens
  // don't live forever.
  let cart;
  if (cartId) {
    cart = await prisma.abandonedCart.findUnique({ where: { id: cartId } });
  } else {
    cart = await prisma.abandonedCart.findUnique({ where: { recoveryToken: token } });
    if (cart) {
      const ageMs = Date.now() - cart.createdAt.getTime();
      if (ageMs > 14 * 24 * 60 * 60_000) cart = null;
    }
  }

  if (!cart) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (cart.recoveredAt) {
    return NextResponse.json({ error: "already recovered" }, { status: 410 });
  }

  return NextResponse.json({
    email: cart.email,
    customerName: cart.customerName,
    items: cart.items,
    subtotal: cart.subtotal,
  });
}
