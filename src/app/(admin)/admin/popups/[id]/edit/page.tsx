import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PopupForm } from "../../_components/popup-form";

export const metadata: Metadata = {
  title: "עריכת פופאפ",
  robots: { index: false, follow: false },
};

type Params = { params: Promise<{ id: string }> };

export default async function EditPopupPage({ params }: Params) {
  const { id } = await params;
  const popup = await prisma.popupCampaign.findUnique({ where: { id } });
  if (!popup) notFound();

  return (
    <div className="p-4 md:p-8 max-w-[1600px]">
      <div className="mb-3">
        <Link
          href="/admin/popups"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 no-underline"
        >
          <ChevronRight className="size-3.5 rotate-180" />
          חזרה לרשימת פופאפים
        </Link>
      </div>
      <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground mb-6">
        עריכת פופאפ: <span className="text-muted-foreground">{popup.name}</span>
      </h1>
      <PopupForm popup={popup} />
    </div>
  );
}
