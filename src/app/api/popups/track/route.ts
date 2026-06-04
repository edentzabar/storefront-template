import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp, POLICIES } from "@/lib/rate-limit";

const bodySchema = z.object({
  id: z.string().min(1).max(60),
  event: z.enum(["impression", "click", "close"]),
});

/**
 * Public endpoint called by the storefront popup component to record
 * interactions. Safe to leave unauthenticated — only increments a counter.
 * Rate-limited per IP so attackers can't pollute analytics or DoS the
 * popup row with hot-path writes.
 */
export async function POST(req: Request) {
  const ip = await getClientIp();
  const rl = await rateLimit(`popup-track:${ip}`, POLICIES.metric);
  if (!rl.ok) return NextResponse.json({ error: "rate limited" }, { status: 429 });

  let parsed;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const field =
    parsed.event === "impression"
      ? "impressions"
      : parsed.event === "click"
        ? "clicks"
        : "closes";

  try {
    await prisma.popupCampaign.update({
      where: { id: parsed.id },
      data: { [field]: { increment: 1 } },
    });
  } catch {
    // popup may have been deleted between fetch and track — silently ignore
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
