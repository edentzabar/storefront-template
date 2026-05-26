import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/cart/recover?token=xxx — returns the cart items for a recovery link. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.json({ error: "missing token" }, { status: 400 });

  const cart = await prisma.abandonedCart.findUnique({ where: { recoveryToken: token } });
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
