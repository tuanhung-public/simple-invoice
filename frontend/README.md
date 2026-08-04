# SimpleInvoice Frontend

Next.js (App Router) + Ant Design + TanStack Query frontend for SimpleInvoice.

## Why Next.js

The assessment asks for **React + TypeScript**. Next.js is that React app with App Router — not a substitute for the NestJS API.

- **Spec fit** — still React + TypeScript; Next is a framework choice on top of React
- **Routes & layout** — `/login`, `/invoices`, `/invoices/[id]`, `/invoices/new` plus a shared authenticated shell map cleanly to the file system
- **Product shape** — signed-in SPA calling Nest with a client JWT; client components + App Router fit without a custom router
- **Delivery** — TypeScript, `next build`, and a simple Docker image for root Compose

We are **not** choosing Next primarily for SEO/SSR. Totals and Overdue stay on the NestJS backend.

See also the root [`README.md`](../README.md) and [`docs/technical-design/`](../docs/technical-design/).

## Run

Prefer root Compose from the monorepo:

```bash
# from repository root
docker compose up
```

App: http://localhost:3000  
Login: `reviewer@101digital.io` / `Password123!`

### Local only (API already running)

```bash
cp .env.example .env.local
npm install
npm run dev
```

`NEXT_PUBLIC_API_URL` defaults to `http://localhost:3001`.

## Tests

```bash
npm test
```

Covers auth redirect/token helpers, login UI validation, create-invoice payload mapping, create form validation, and invoice list UI (mocked table data).

## Known limitations

- Relies on the backend for totals, Overdue derivation, and uniqueness.
- Auth token in `localStorage` (shared across tabs — last login wins). The header profile refetches on tab focus and when another tab changes the token (`storage` event).
- Create form supports a single line item (per assessment).
