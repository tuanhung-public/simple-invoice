# SimpleInvoice Backend

NestJS + Prisma + PostgreSQL backend for the **101 Digital SimpleInvoice** assessment.

This repository is the **packaging entrypoint**: it contains `docker-compose.yml` that also builds the sibling **frontend**.

## Clone both repositories (required for Docker)

```bash
mkdir simple-invoice && cd simple-invoice
git clone <BACKEND_REPO_URL> backend
git clone <FRONTEND_REPO_URL> frontend
cd backend
cp .env.example .env   # edit secrets — never commit .env
docker compose up --build
```

Expected sibling layout:

```text
simple-invoice/
├── backend/      # this repo (compose lives here)
└── frontend/     # frontend repo
```

### Ports (defaults)

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| Swagger | http://localhost:3001/api/docs |
| Postgres | localhost:5433 |

### Default reviewer login

- Email: `reviewer@101digital.io`
- Password: `Password123!`

On backend container start: migrations run and the database is seeded automatically.

---

## Run locally (without full Docker stack)

```bash
# From backend/
cp .env.example .env

# Start only Postgres (uses this repo's compose)
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

Seeds the Appendix A sample invoice, ~30 additional invoices, and the reviewer user above.

---

## Tests

**Unit tests** (no DB required):

```bash
npm test
```

**E2E / integration** (requires Postgres + migrated + seeded data):

```bash
docker compose up -d db
npx prisma migrate deploy   # or: npx prisma migrate dev
npm run seed
npm run test:e2e
```

---

## Environment

All secrets come from `.env` (see `.env.example`). Do **not** commit `.env`.

Compose reads `env_file: .env` — JWT and DB passwords are not hard-coded in `docker-compose.yml`.

Each Compose service has its own Dockerfile:

- `Dockerfile` — Backend
- `../frontend/Dockerfile` — Frontend (sibling repo)
- `docker/db/Dockerfile` — Postgres (thin wrapper over official image)

---

## Architecture decisions / assumptions

- Two separate repos; compose lives in **backend** and expects `../frontend`.
- Frontend is **Next.js** (React + TypeScript) + Ant Design.
- **Customer** is a separate table; create finds/creates by email.
- **Overdue** is derived at read time; DB only stores Draft / Pending / Paid.
- Filtering `Draft` / `Pending` excludes past-due rows (those appear under `Overdue`).
- Totals are calculated only on the server.
- Duplicate `invoiceNumber`: pre-check + Prisma `P2002` → HTTP 409.

---

## Known limitations

- Create supports **one** line item only (schema allows more later).
- No update/delete invoice endpoints (out of assessment scope).
- JWT is stored in browser `localStorage` (assessment client-side token requirement).
- Full-stack Docker requires both repos cloned as siblings named `backend` and `frontend`.
- Reviewers who clone **only** this repo can still run backend + DB via compose, but the **frontend** service build will fail until `../frontend` exists.
