/**
 * Brand color palette as raw hex values — used by contexts that
 * CANNOT read CSS variables, namely transactional HTML emails (gmail,
 * outlook, etc. inline all styles and don't see :root vars).
 *
 * ⚠️  Keep these in sync with the CSS variables defined at the top of
 *     src/app/globals.css. If you re-skin, update BOTH:
 *       - globals.css  (drives the website + admin)
 *       - this file    (drives outgoing emails)
 */
export const brandPalette = {
  primary: "#1a1814",
  accent: "#b8935a",
  accentLight: "#d4b683",
  accentDark: "#8b6f43",
  bg: "#faf7f0",
  bgSoft: "#f5f0e6",
  surface: "#fdfaf3",
  text: "#3a342c",
  textSoft: "#6b6258",
  border: "#ebe4d7",
} as const;

export type BrandPalette = typeof brandPalette;
