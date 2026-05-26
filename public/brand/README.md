# /public/brand/

Drop-in folder for per-client branding assets. Replace these files
when you re-skin the template — code references them via fixed paths
so you don't need to touch components.

| File          | Used by                              | Recommended            |
| ------------- | ------------------------------------ | ---------------------- |
| `logo.png`    | JSON-LD logo, OG fallback            | 512×512 PNG, transparent |
| `favicon.png` | `<link rel="icon">` (browser tabs)   | 32×32 or 64×64 PNG      |
| `og.png`      | Open Graph share image (social)      | 1200×630 PNG/JPG        |
| `hero.jpg`    | Storefront homepage hero             | 1920×1080+ JPG          |
| `about.jpg`   | "About" section on the homepage      | 800×1000 JPG (portrait) |

If you skip a file the page still renders, but the missing asset
shows a broken image / no preview on social shares. Always at minimum
provide `logo.png`, `favicon.png`, and `og.png` before going live.

Image paths in code:
- `src/app/layout.tsx`             → favicon
- `src/lib/site-config.ts` (ogImage) → og
- `src/app/(storefront)/page.tsx` (JSON-LD) → logo
- `src/lib/data/content.ts`        → hero, about
