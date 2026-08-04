# SimpleInvoice Backend

NestJS + Prisma + PostgreSQL for the **101 Digital SimpleInvoice** assessment.

This project is a **monorepo**. Prefer starting the full stack from the **repository root**:

```bash
docker compose up
```

## Ports (defaults)

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| Swagger | http://localhost:3001/api/docs |
| Postgres | localhost:5433 |

## Default reviewer login

- Email: `reviewer@101digital.io`
- Password: `Password123!`

On backend container start: migrations run and the database is seeded automatically.

---

## Run locally (API only)

```bash
# From backend/
cp .env.example .env

# Start only Postgres
docker compose up -d db

npm install
npx prisma migrate dev
npm run seed
npm run start:dev
```

Frontend (separate terminal):

```bash
cd ../frontend
cp .env.example .env.local
npm install
npm run dev
```

---

## Database seed

```bash
npm run seed
```

---

## Tests

**Unit tests** (no DB required):

```bash
npm test
```

**E2E / integration** (requires Postgres + migrated + seeded data):

```bash
docker compose up -d db
npx prisma migrate deploy
npm run seed
npm run test:e2e
```

---

## Environment

- Full-stack Docker uses Compose defaults (override with a root `.env` if needed).
- Local `npm run start:dev` uses `backend/.env` (from `.env.example`).
- Do **not** commit real `.env` files.

Dockerfiles:

- `Dockerfile` — Backend
- `../frontend/Dockerfile` — Frontend
- `docker/db/Dockerfile` — Postgres

---

## Architecture decisions / assumptions

- Monorepo (`backend/` + `frontend/`); root `docker-compose.yml` starts all services.
- Frontend is **Next.js** (React + TypeScript) + Ant Design.
- **Customer** is a separate table; create **upserts by email** (case-insensitive). Reusing an existing customer email updates that customer's name/mobile/address — email is the unique business key.
- **Overdue** is derived at read time; DB only stores Draft / Pending / Paid.
- Filtering `Draft` / `Pending` excludes past-due rows (those appear under `Overdue`).
- Totals are calculated only on the server (default tax **10%**, range **0–1000%**; discount **0** when omitted).
- Discount cannot exceed subtotal + tax (total must be ≥ 0).
- List `toDate` includes the full UTC day; default `pageSize` is **15** (max 100).
- Duplicate `invoiceNumber`: pre-check + Prisma `P2002` → HTTP 409.

---

## Known limitations

- Create supports **one** line item only (schema allows more later).
- No update/delete invoice endpoints (out of assessment scope).
- JWT is stored in browser `localStorage` (assessment client-side token requirement).
