/**
 * KodMax footer credit. SEO-friendly static <a> (not injected via JS)
 * so Google reads the link on first render.
 *
 * Rendered as a thin strip BELOW the main <Footer />. Centered, in a
 * slightly larger size than the original kit default (14px label / 16px
 * wordmark) so it's a touch more legible. The red `#e8310f` on "MAX"
 * is part of the KodMax brand — do not change.
 */
export function KodMaxCredit({
  theme = "dark",
  lang = "he",
}: {
  theme?: "dark" | "light";
  lang?: "he" | "en";
}) {
  const isDark = theme === "dark";
  const isEnglish = lang === "en";
  const label = isEnglish ? "Designed & developed by" : "עוצב ופותח על ידי";

  return (
    <div
      className={
        isDark
          ? "bg-brand-primary border-t border-white/10 py-4 px-6 flex justify-center"
          : "bg-brand-bg-soft border-t border-brand-border py-4 px-6 flex justify-center"
      }
    >
      <a
        href="https://www.kodmax.co.il/"
        target="_blank"
        rel="noopener noreferrer"
        dir={isEnglish ? "ltr" : "rtl"}
        aria-label="KodMax"
        className="no-underline inline-flex items-center gap-2"
        style={{
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: 14,
          lineHeight: 1,
          color: isDark ? "#9a9a9a" : "#555555",
        }}
      >
        <span>{label}</span>
        <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: "-0.5px" }}>
          <span style={{ color: isDark ? "#e8e2d6" : "#111111" }}>KOD</span>
          <span style={{ color: "#e8310f" }}>MAX</span>
        </span>
      </a>
    </div>
  );
}
