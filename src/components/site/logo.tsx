import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getSiteSettings } from "@/lib/site-settings";

type Props = {
  size?: "sm" | "md" | "lg";
  className?: string;
  asLink?: boolean;
};

const sizeStyles: Record<NonNullable<Props["size"]>, { text: string; tagline: string; tracking: string; imageHeight: number }> = {
  sm: { text: "text-[1.05rem]", tagline: "text-[0.42rem]", tracking: "tracking-[0.32em]", imageHeight: 28 },
  md: { text: "text-[1.65rem]", tagline: "text-[0.5rem]", tracking: "tracking-[0.32em]", imageHeight: 40 },
  lg: { text: "text-[2.2rem]", tagline: "text-[0.6rem]", tracking: "tracking-[0.32em]", imageHeight: 56 },
};

export async function Logo({ size = "md", className, asLink = true }: Props) {
  const settings = await getSiteSettings();
  const s = sizeStyles[size];

  const content = settings.brand.logoUrl ? (
    <Image
      src={settings.brand.logoUrl}
      alt={settings.brand.name}
      width={s.imageHeight * 4}
      height={s.imageHeight}
      className={cn("object-contain", className)}
      style={{ height: s.imageHeight, width: "auto" }}
      unoptimized={settings.brand.logoUrl.startsWith("http") && !settings.brand.logoUrl.includes("vercel-storage.com")}
      priority
    />
  ) : (
    <span className={cn("inline-flex flex-col items-center leading-none", className)}>
      <span
        className={cn(
          "font-display font-medium text-gold-grad",
          s.text,
          s.tracking,
          "px-[0.5em] pr-[0.4em] pt-[0.15em] pb-[0.15em] leading-[1.3]",
        )}
      >
        {settings.brand.name}
      </span>
      <span
        className={cn(
          "font-body uppercase text-brand-accent leading-none",
          s.tagline,
          "tracking-[0.4em] -mt-0.5 pl-[0.4em] pr-[0.2em]",
        )}
      >
        {settings.brand.tagline}
      </span>
    </span>
  );

  if (!asLink) return content;

  return (
    <Link
      href="/"
      aria-label={`${settings.brand.name} - דף הבית`}
      className="no-underline inline-block"
    >
      {content}
    </Link>
  );
}
