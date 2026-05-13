# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

- **api-server** — Express 5 + Drizzle/PG REST API at `/api/*`. Auth (sessions cookies + bcrypt), rate-limit, helmet, RBAC (admin/user). Routes split by domain in `src/routes/*` and aggregated in `routes/index.ts`. `meRouter` is mounted at `/me` so its `requireAuth` middleware does not leak to other routers.
- **cannazen** — Vite/React e-commerce front for cannazen.fr. Faithful to cannazen.best design; legal compliance: age gate +18, cookie banner CNIL, COA on product, RGPD opt-out, no therapeutic claims.
- **mockup-sandbox** — design canvas (unused for production).

## CannaZen — Functional summary

- **Public**: home, /boutique, /produit/:slug (with COA + adult warning), /panier, /checkout (Colissimo / Mondial Relay / Chronopost / Click&Collect; mock PayPlug), /confirmation, /blog, /quiz, /contact, /pages légales (5).
- **Account**: /connexion, /inscription, /mon-compte (dashboard, adresses, commandes, profil, fidélité, abonnements, avis).
- **Admin** (`/console-cz`, default seed `admin@cannazen.fr` / `ChangeMe!Cannazen2026` only in dev): dashboard KPI, produits, catégories, commandes, clients, blog, codes promo, abonnements, fidélité, modération avis, email outbox, audit logs, réglages. Production seed disabled unless `ADMIN_EMAIL`/`ADMIN_PASSWORD` env are set.

## Provider pattern (no external keys required)

All third-party services implemented as interfaces with mock impls — swap to real impl when a key is provided:
- **PaymentProvider** → MockPaymentProvider (PayPlug-ready). Webhook strict-checks `paymentIntentId` and is gated to non-prod or shared secret in prod.
- **EmailProvider** → ConsoleEmailProvider (Brevo-ready) — writes to `email_outbox` table.
- **ShippingProvider** — 4 carriers, weight-based pricing, free shipping > 49€.

## Security

- Cart mutations / `GET /orders/:id` enforce ownership via `x-session-id` header or authenticated user (no IDOR).
- Order POST requires `ageConfirmed: true` and `acceptTerms: true` Zod literals.
- `noImplicitReturns: false` only in api-server (Express convention with early `return res...`).
