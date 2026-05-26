import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  id: z.string().min(1),
  event: z.enum(["impression", "click", "close"]),
});

/**
 * Public endpoint called by the storefront popup component to record
 * interactions. Safe to leave unauthenticated — only increments a counter.
 */
export async function POST(req: Request) {
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
