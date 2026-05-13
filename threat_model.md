# Threat Model

## Project Overview

CannaZen is a pnpm monorepo with a production React/Vite storefront (`artifacts/cannazen`) backed by an Express 5 REST API (`artifacts/api-server`) and PostgreSQL via Drizzle (`lib/db`). The site supports public shopping, guest checkout, authenticated customer accounts, and an admin console for products, orders, customers, promotions, blog posts, reviews, and audit/email views.

Production authentication is split across two mechanisms: server-issued cookie sessions for logged-in users and a client-generated `X-Session-Id` value used to track anonymous carts, wishlists, consent, and guest orders. The mockup sandbox artifact is development-only and should usually be ignored unless production reachability is demonstrated.

## Assets

- **User accounts and active sessions** — password hashes, session cookies, password-reset and email-verification tokens, and account profile data. Compromise enables account takeover and access to stored addresses and order history.
- **Customer order and fulfillment data** — names, email addresses, phone numbers, shipping/billing addresses, payment status, tracking information, loyalty activity, and guest order history. This is both PII and business-sensitive order data.
- **Admin capabilities** — server-side admin APIs can modify products, orders, blog content, promotions, newsletters, subscriptions, audit views, and customer records. Compromise has broad business impact.
- **Anonymous shopping state** — guest cart, wishlist, consent, and guest order linkage keyed by client-provided `sessionId`. This is lower trust than authenticated sessions but still controls access to user-visible data and state changes.
- **Application secrets and provider trust** — session secret, admin bootstrap credentials, webhook secret, database credentials, and any future real payment/email provider keys.

## Trust Boundaries

- **Browser to API** — all frontend input is untrusted. The API must validate and authorize every request, including guest flows that currently rely on `X-Session-Id`.
- **Authenticated cookie session to anonymous session state** — logged-in identity is server-issued, but guest cart/order ownership is client-generated and supplied on every request. This is a high-risk mixed-trust boundary.
- **API to PostgreSQL** — the API has full database access. Injection or broken authorization in route handlers can expose or modify sensitive data across tenants and roles.
- **Public to authenticated to admin** — product browsing, checkout, and blog are public; account features require authentication; admin routes require server-side role checks. These boundaries must never rely on frontend enforcement.
- **API to outbound providers** — payment, shipping, and email abstractions may become real integrations later. Webhooks and provider callbacks must be authenticated and constrained.
- **Internal/development to production** — dev helpers such as mock payment flows, default admin seeding outside production, and the mockup sandbox should not be assumed safe if they become reachable in production.

## Scan Anchors

- **Production entry points:** `artifacts/api-server/src/index.ts`, `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/routes/*`, `artifacts/cannazen/src/App.tsx`, `artifacts/cannazen/src/lib/api.ts`.
- **Highest-risk code areas:** auth/session code in `artifacts/api-server/src/lib/auth.ts` and `src/routes/auth.ts`; anonymous cart/order/wishlist flows in `src/routes/{cart,orders,wishlist,consent}.ts` plus `artifacts/cannazen/src/lib/session.ts`; admin CRUD in `src/routes/admin.ts`; payment webhook handling in `src/routes/payment.ts`; blog rendering in `artifacts/cannazen/src/pages/blog-post.tsx`.
- **Public vs authenticated vs admin surfaces:** most `/api/*` routers are public or mixed; `/api/me/*` is authenticated; `/api/admin/*` is admin-only via middleware; `/console-cz` is the admin UI.
- **Usually dev-only and ignorable:** `artifacts/mockup-sandbox`; default seeded admin credentials when `NODE_ENV !== production`.

## Threat Categories

### Spoofing

The application uses secure random server-side cookie sessions for authenticated users, but it also trusts a client-generated `X-Session-Id` value to represent anonymous ownership for carts, wishlists, consent, and guest orders. The system must treat that identifier as untrusted input rather than as a strong identity primitive. All authenticated and admin endpoints must require a valid server-issued session, and any provider callback or webhook must verify its origin before mutating order state.

### Tampering

Customers can submit cart, checkout, profile, review, newsletter, and admin-managed content inputs. The API must validate every body, parameter, and header at the server boundary and must never allow client-controlled identifiers to reassign or mutate another user’s state. Order totals, stock changes, promo application, and fulfillment actions must remain fully server-side and resistant to replay or forged requests.

### Information Disclosure

The API and storefront handle PII, guest order data, admin dashboards, audit logs, and email outbox records. Responses must be scoped to the correct user or admin role, and logs must not leak cookies, session identifiers, reset tokens, or internal headers. Public rendering surfaces such as blog content must not allow attacker-controlled markup to execute in visitors’ browsers, because that would expose sessions and customer data.

### Denial of Service

Public catalog, auth, checkout, and webhook routes are internet-facing. Authentication endpoints already use rate limiting, but other expensive or state-changing endpoints still need bounded input sizes, safe query patterns, and reasonable abuse resistance. External provider calls must fail safely and avoid unbounded retries or hangs.

### Elevation of Privilege

The largest privilege boundary is between public/guest traffic, authenticated customers, and admins. Server-side middleware must enforce these roles on every route, and credential lifecycle events such as password resets or password changes must revoke stale sessions so a previously stolen cookie cannot retain access. Any admin-controlled content that is later rendered in a public browser must be sanitized or otherwise constrained so CMS access cannot become arbitrary script execution against visitors.