# Storefront Template

White-label e-commerce template for spinning up RTL Hebrew storefronts.
One fork = one client. Built to be re-skinned in 1-2 hours from an HTML mockup.

`Next.js 16` (`App Router` + `Turbopack`) · `TypeScript` · `Tailwind 4` · `shadcn` / `base-ui` (`RTL`) · `Prisma 6` + `Supabase` (`Postgres`) · `better-auth` · `Zustand` · `Vercel Blob` · `Resend`.

---

## Quick start (new client)

```bash
# 1. Fork the template on GitHub (Use this template button)
# 2. Clone the fork
git clone <your-fork-url> client-name
cd client-name

# 3. Install
nvm use --lts          # Node 24+
pnpm install

# 4. Set up env — see "Environment" below
cp .env.example .env.local
# fill in DATABASE_URL, DIRECT_URL, BETTER_AUTH_*

# 5. Set up the database
pnpm db:setup          # runs migrate + seed
pnpm db:make-admin you@example.com   # promote first user to admin

# 6. Run
pnpm dev               # http://localhost:3000
```

For the full re-skin checklist (what to edit per client) see **[THEMING.md](./THEMING.md)**.

---

## Project structure

```
template/
├── prisma/
│   ├── schema.prisma        # User, Session, Category, Product, Order, Popup…
│   ├── migrations/
│   ├── seed.ts              # placeholder categories — no sample products
│   └── make-admin.ts        # promote a user by email
│
├── public/brand/            # per-client assets — logo, favicon, hero, OG
│
├── src/
│   ├── app/
│   │   ├── (storefront)/    # public storefront route group
│   │   ├── (admin)/         # /admin route group — auth-gated
│   │   ├── api/
│   │   ├── layout.tsx       # root layout — RTL, fonts, metadata
│   │   ├── sitemap.ts
│   │   └── robots.ts
│   │
│   ├── components/
│   │   ├── site/            # storefront UI
│   │   ├── admin/           # admin UI (sidebar, dashboard, etc.)
│   │   └── ui/              # shadcn/base-ui primitives
│   │
│   └── lib/
│       ├── site-config.ts   # ◀︎ brand name, contact, social, shop policies
│       ├── brand.ts         # ◀︎ raw hex palette for emails (mirror of globals.css)
│       ├── data/
│       │   ├── content.ts   # ◀︎ hero, nav, footer, copy
│       │   └── static-pages.ts  # ◀︎ about, FAQ, shipping, returns, privacy, terms
│       ├── auth.ts          # better-auth + Prisma adapter
│       ├── prisma.ts        # Prisma singleton
│       ├── queries.ts       # all storefront + admin DB reads
│       ├── admin/           # admin server actions
│       ├── email/           # transactional email templates
│       ├── payment/         # PSP integration (mock by default)
│       └── stores/          # Zustand stores (cart, wishlist, admin UI)
```

The four files marked ◀︎ are the per-client override points. Brand colors
live in `src/app/globals.css` (CSS variables) — mirror them in `lib/brand.ts`
when you change them.

---

## Commands

| Command                       | What it does                                        |
| ----------------------------- | --------------------------------------------------- |
| `pnpm dev`                    | Local dev (`http://localhost:3000`)                 |
| `pnpm build`                  | Production build                                    |
| `pnpm start`                  | Run a built app                                     |
| `pnpm db:generate`            | Generate Prisma client (auto on postinstall)        |
| `pnpm db:migrate`             | Create + run a new migration (dev)                  |
| `pnpm db:deploy`              | Apply existing migrations (prod)                    |
| `pnpm db:seed`                | Seed placeholder categories                         |
| `pnpm db:setup`               | `db:deploy` + `db:seed`                             |
| `pnpm db:make-admin <email>`  | Promote a user to admin                             |
| `pnpm db:studio`              | Open Prisma Studio for manual edits                 |

---

## Environment

```
# Postgres (Supabase recommended)
DATABASE_URL=                  # pooled connection (Supabase: port 6543, pgbouncer=true)
DIRECT_URL=                    # direct connection (Supabase: port 5432, used for migrations)

# Auth
BETTER_AUTH_SECRET=            # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
BETTER_AUTH_URL=               # http://localhost:3000 in dev, prod URL in prod
NEXT_PUBLIC_BETTER_AUTH_URL=   # same as BETTER_AUTH_URL

# Optional
BLOB_READ_WRITE_TOKEN=         # Vercel Blob — used by /admin/import to host images
RESEND_API_KEY=                # transactional emails (order confirmations, abandoned-cart)
RESEND_FROM=                   # verified sender, e.g. "Brand <noreply@yourdomain.com>"
```

See `.env.example` for a copy-paste template.

---

## What's included

**Storefront**
- Homepage with hero, categories, featured products, CTA, about
- Product / category / search / sale / shop pages
- Cart drawer + full cart page (Zustand + localStorage)
- 3-step checkout (details → shipping → payment) → confirmation
- Wishlist, account, login/signup
- Static info pages (about, FAQ, shipping, returns, privacy, terms, size guide)
- Full SEO (metadata, JSON-LD, OG, Twitter cards, sitemap, robots)
- Configurable popups (newsletter, announcement, promotion)

**Admin / CRM (`/admin`)**
- Dashboard — orders, revenue, top products
- Products — CRUD, featured toggle, stock, image gallery
- Categories — CRUD with safe-delete
- Orders — list, detail, status updates, abandoned-cart recovery
- Customers — list, detail, segments (VIP/new/at-risk/lapsed), notes, tags
- Coupons — % / fixed amount / free shipping, usage caps
- Popups — visual editor, triggers, frequency, scheduling
- Reports — revenue, top categories, customer cohorts
- Settings, theme toggle, command palette
- **Product import** — Shopify + WooCommerce CSV → batched server actions, optional Blob image rehosting

**Auth + infra**
- `better-auth` email + password, 30-day sessions
- Admin gate on `/admin` (`isAdmin` check)
- Mock payment processor with test cards — swap to a real PSP via `src/lib/payment/`

---

## Demo / reference

The original implementation (JACOB Fine Jewelry — luxury jewelry vertical)
lives in a separate repo and serves as a polished reference deployment.
This template is the generic source it descended from.
