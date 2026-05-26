import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { PopupCampaign } from "@prisma/client";

/** Public-facing popup shape — no admin-only fields. */
export type ActivePopup = Pick<
  PopupCampaign,
  | "id"
  | "title"
  | "body"
  | "imageUrl"
  | "ctaText"
  | "ctaUrl"
  | "couponCode"
  | "triggerType"
  | "triggerValue"
  | "frequencyType"
  | "frequencyDays"
  | "audience"
  | "pageTarget"
>;

/** Fetch active popups, respecting the optional start/end window. Cached short. */
export const getActivePopups = unstable_cache(
  async (): Promise<ActivePopup[]> => {
    const now = new Date();
    const rows = await prisma.popupCampaign.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      select: {
        id: true,
        title: true,
        body: true,
        imageUrl: true,
        ctaText: true,
        ctaUrl: true,
        couponCode: true,
        triggerType: true,
        triggerValue: true,
        frequencyType: true,
        frequencyDays: true,
        audience: true,
        pageTarget: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return rows;
  },
  ["active-popups"],
  { revalidate: 60, tags: ["popups"] },
);
