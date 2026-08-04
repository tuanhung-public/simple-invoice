# SimpleInvoice

Full-stack invoice demo (monorepo): **NestJS** backend + **Next.js** frontend.

| Folder | Role |
|--------|------|
| [`backend/`](./backend) | NestJS API, Prisma, Dockerfiles |
| [`frontend/`](./frontend) | Next.js UI |

## Run with Docker (recommended)

From the repository root:

```bash
git clone https://github.com/tuanhung-public/simple-invoice.git
cd simple-invoice
docker compose up
```

No `.env` copy is required — Compose uses safe demo defaults. Optional overrides: create a root `.env` (see `backend/.env.example`).

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| Swagger | http://localhost:3001/api/docs |
| Postgres | localhost:5433 |

## Default login

- Email: `reviewer@101digital.io`
- Password: `Password123!`

On backend start: migrations run and the database is seeded automatically.

## Run without full Docker stack

```bash
# Terminal 1 — Postgres
cd backend
docker compose up -d db

# Terminal 2 — API
cp .env.example .env   # only needed for local npm (not for docker compose up)
npm install
npx prisma migrate dev
npm run seed
npm run start:dev

# Terminal 3 — Web
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

## Seed

```bash
cd backend && npm run seed
```

## Tests

```bash
cd backend && npm test
cd backend && docker compose up -d db && npx prisma migrate deploy && npm run seed && npm run test:e2e
cd frontend && npm test
```

## Why Next.js (frontend)

The assessment requires a **React + TypeScript** frontend. **Next.js (App Router)** is used as that React application — not as a replacement for the NestJS API.

| Reason | Detail |
| ------ | ------ |
| Spec fit | Still React + TypeScript; Vite/CRA would also be valid — Next is a deliberate framework choice on top of React |
| Routing & layout | File-based routes map cleanly to the four flows (`/login`, `/invoices`, `/invoices/[id]`, `/invoices/new`) plus a shared authenticated shell |
| Product shape | This is a signed-in invoice console calling a Nest REST API with a client-held JWT — App Router + client components fit that SPA-style UI without inventing a custom router |
| Delivery | First-class TypeScript, production `next build`, and a straightforward Dockerfile for Compose |

**What we are not claiming:** SEO/SSR as the main driver. Invoice data and totals stay on the **NestJS** backend; the UI does not treat client-side math as source of truth.

More architecture notes: [`docs/technical-design/`](./docs/technical-design/).

## Architecture / assumptions

- Monorepo; root `docker compose up` starts frontend, API, and database.
- See [`backend/README.md`](./backend/README.md) and [`docs/technical-design/`](./docs/technical-design/) for design decisions (Customer table, Overdue derivation, API contract, etc.).

## Known limitations

See [`backend/README.md`](./backend/README.md#known-limitations).
