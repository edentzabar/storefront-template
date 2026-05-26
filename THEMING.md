# Theming & re-skin guide

This file is the checklist for taking a fresh fork of the template
and turning it into a specific client's storefront. The intended
workflow is: client supplies an HTML mockup → you adjust the files
below → deploy.

The whole re-skin should take 1-2 hours if no structural layout
changes are needed.

---

## The 5 files you (almost) always edit

### 1. `src/lib/site-config.ts` — brand name, contact, shop policies

Single source of truth for everything that's brand-name dependent.
Edit this **first** — most other files read from it.

```ts
{
  name: "Bella Boutique",
  tagline: "Curated Womenswear",
  title: "Bella Boutique · בוטיק נשים",
  description: "...",
  url: "https://bella-boutique.co.il",
  contact: { phone, email, instagram, whatsapp, … },
  shop: { freeShippingMin, returnDays, maxInstallments, … },
}
```

Changing `name` propagates to the admin sidebar (white-label),
all emails, all metadata, JSON-LD, mailto subjects, copyright, etc.

### 2. `src/app/globals.css` — brand colors

Change the 4 hex values in `:root`:

```css
--brand-primary: #1a1814;
--brand-bg: #faf7f0;
--brand-accent: #b8935a;
--brand-accent-light: #d4b683;
--brand-accent-dark: #8b6f43;
```

Everything (admin + storefront) re-skins automatically because
Tailwind classes like `text-brand-accent` and `.bg-brand-gradient`
read these vars.

### 3. `src/lib/brand.ts` — email palette (mirror of globals.css)

Emails are HTML strings sent to third-party clients (gmail, outlook)
that **don't** see CSS variables. So we duplicate the hex values
here. **Keep this in sync with globals.css.**

### 4. `src/lib/data/content.ts` — hero, nav, footer copy

- `hero` — main image, headline, subhead, CTA
- `navItems` — top-bar links (point at real category slugs)
- `sections` — categories/products/about section headers
- `footer` — column structure (contact column auto-reads siteConfig)

### 5. `src/lib/data/static-pages.ts` — about, FAQ, shipping, returns, privacy, terms

Generic placeholder text ships with the template. Replace with the
client's real policy content. Numbers (free-shipping threshold,
return days, installments) auto-pull from siteConfig so you usually
don't have to edit those manually.

---

## Brand assets — `/public/brand/`

Drop these in:

| File          | Recommended size       |
| ------------- | ---------------------- |
| `logo.png`    | 512×512 PNG transparent |
| `favicon.png` | 32×32 or 64×64         |
| `og.png`      | 1200×630 (social share) |
| `hero.jpg`    | 1920×1080+              |
| `about.jpg`   | 800×1000 portrait       |

Code paths are fixed — replace files in place, no component edits needed.

---

## Receiving an HTML mockup from the client

Workflow when the client provides a Claude-generated HTML mockup:

1. **Scan the mockup** for the color palette → update `globals.css` + `brand.ts`.
2. **Identify the fonts** → if non-default, swap the `Heebo` / `Cormorant_Garamond`
   imports in `src/app/layout.tsx`.
3. **Logo / images** → drop into `/public/brand/`.
4. **Hero structure** — does the mockup match the existing hero layout?
   - If yes: just update `hero` in `content.ts` + replace `/public/brand/hero.jpg`.
   - If no: edit `src/components/site/hero.tsx`.
5. **Section order / homepage layout** — `src/app/(storefront)/page.tsx`.
6. **Product card style** — `src/components/site/product-card.tsx`.
7. **Category card style** — `src/components/site/categories-grid.tsx`.
8. **Header / footer style** — `src/components/site/header.tsx`, `footer.tsx`.

The admin panel does **not** need any re-skin work — it picks up the
new colors + brand name automatically.

---

## Setting up the database (per client)

Each client should have **its own Supabase project** — never share a DB
between clients.

1. Create a fresh Supabase project at https://supabase.com
2. SQL Editor → run nothing (Prisma owns the schema).
3. Settings → Database → copy the **Transaction pooler** connection
   string (port 6543) → `DATABASE_URL` in `.env.local`.
4. Copy the **Direct connection** string (port 5432) → `DIRECT_URL`.
5. `pnpm db:setup` (runs migrations + seeds placeholder categories).
6. `pnpm db:make-admin you@example.com` to promote the first admin.

---

## Deploying (per client)

1. Push the fork to its own GitHub repo.
2. Create a new Vercel project pointing at that repo.
3. Add env vars (DATABASE_URL, DIRECT_URL, BETTER_AUTH_*, etc.).
4. First deploy will run `pnpm install` + `pnpm build`. Migrations run
   automatically via the `postinstall` script.
5. Connect the client's custom domain.
6. Set `BETTER_AUTH_URL` + `NEXT_PUBLIC_BETTER_AUTH_URL` to the prod URL.

---

## Things you should NOT need to touch

- `prisma/schema.prisma` — the data model is intentionally generic and
  fits jewelry, fashion, electronics, etc. Add a column only if a client
  truly needs it.
- `src/lib/auth.ts` — branded automatically via siteConfig.
- `src/lib/admin/` — admin server actions are vertical-agnostic.
- `src/lib/queries.ts` — DB reads, no brand content.
- `src/components/admin/` — admin UI re-skins automatically via tokens.

If you find yourself editing these, ask whether the change should go
back into the **template** so all future clients benefit.

---

## When to upstream a change

You're working on client X and you build something genuinely reusable
(a new feature, a better component, a bug fix). Upstream it:

1. Make the change in the template repo (this one).
2. In client X's repo, `git remote add template <template-url>` and
   `git cherry-pick` the commit.
3. For client Y / Z that also want it: same `cherry-pick`.

Resist the urge to dump client-specific decisions back into the template.
