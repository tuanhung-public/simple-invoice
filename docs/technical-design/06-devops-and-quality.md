# 06 — DevOps and quality

How SimpleInvoice is packaged, configured, seeded, tested, and which limitations reviewers should expect.

Run overview also lives in the [root README](../../README.md). Business behaviour: [../use-cases/](../use-cases/).

---

## One-command stack

From the **repository root**:

```bash
docker compose up
```

Compose starts three services, each with its own Dockerfile:

| Service | Build context | Image basis | Host port (default) |
| ------- | ------------- | ----------- | ------------------- |
| `db` | `backend/docker/db` | `postgres:16-alpine` | **5433** → 5432 |
| `backend` | `backend/` | Node 22 multi-stage Nest build | **3001** |
| `frontend` | `frontend/` | Node 22 multi-stage Next build | **3000** |

`backend` waits until Postgres is healthy, then the container entrypoint runs:

1. `prisma migrate deploy`  
2. `tsx prisma/seed.ts`  
3. NestJS production server  

| URL | Purpose |
| --- | ------- |
| http://localhost:3000 | Web UI |
| http://localhost:3001 | REST API |
| http://localhost:3001/api/docs | Swagger |
| localhost:5433 | PostgreSQL (host tools / local npm) |

**Default login:** `reviewer@101digital.io` / `Password123!`

---

## Environment configuration

Secrets and ports come from environment variables — not hard-coded in application source.

| Mode | How config is supplied |
| ---- | ---------------------- |
| `docker compose up` | Compose **demo defaults** inline (`postgres` / demo `JWT_SECRET`, etc.). Optional root `.env` overrides (see `backend/.env.example`) |
| Local `npm run start:dev` | Copy `backend/.env.example` → `backend/.env` |
| Local Next.js | Copy `frontend/.env.example` → `frontend/.env.local` (`NEXT_PUBLIC_API_URL`) |

Do **not** commit real `.env` files. Only `.env.example` belongs in git.

### Main variables

| Variable | Role | Typical default |
| -------- | ---- | --------------- |
| `POSTGRES_*` | Database user / password / name | `postgres` / `simple_invoice` |
| `POSTGRES_PORT` | Host port for Postgres | `5433` |
| `DATABASE_URL` | Prisma connection (local npm uses host port 5433) | see `.env.example` |
| `JWT_SECRET` | Token signing key | demo secret (change for non-demo use) |
| `JWT_EXPIRES_IN` | Access token lifetime (seconds) | `3600` |
| `PORT` / `API_PORT` | API listen / publish port | `3001` |
| `CORS_ORIGIN` | Allowed browser origin | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | Browser → API base URL | `http://localhost:3001` |
| `WEB_PORT` | Frontend publish port | `3000` |

---

## Local development (without full Compose UI)

```bash
# Postgres only (from repo that provides compose — prefer root)
docker compose up -d db

# API
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run seed
npm run start:dev

# UI (separate terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

---

## Database seed

```bash
cd backend && npm run seed
```

Also runs automatically when the **backend container** starts.

Seed contents:

- Reviewer user (credentials above)  
- Appendix A–style sample invoice and relationships  
- Additional invoices (~30) with mixed Draft / Pending / Paid, dates, and amounts  
- **No** persisted `Overdue` status — Overdue appears via derivation when due dates are in the past  

---

## Quality: tests

### Backend

| Command | Needs DB? | Covers |
| ------- | --------- | ------ |
| `cd backend && npm test` | No | Unit tests — totals, Overdue derivation, due-date rules, invoice service/validation |
| `cd backend && npm run test:e2e` | Yes (migrated + seeded) | Integration — login → create → detail → list → duplicate `409` |

Example e2e prep:

```bash
docker compose up -d db
cd backend
npx prisma migrate deploy
npm run seed
npm run test:e2e
```

### Frontend

```bash
cd frontend && npm test
```

Vitest + Testing Library: auth helpers, login validation, list smoke UI, create validation / payload mapping, list-state helpers.

### API documentation

Swagger UI at `/api/docs` is generated with `@nestjs/swagger` and documents endpoints, DTOs, and auth.

---

## Assumptions (submission-relevant)

- **Monorepo** with root `docker-compose.yml` for the full stack.  
- Frontend is **Next.js** (React + TypeScript) + Ant Design.  
- **Customer** is a separate table; create upserts by email.  
- **Totals** are computed only on the server; create UI preview is informational.  
- **Overdue** is derived at read/filter time; list Draft/Pending filters exclude past-due rows.  
- Duplicate invoice numbers → **409** (pre-check + Prisma `P2002`).  
- Default list `pageSize` is **15** (max 100).  

---

## Known limitations

- Create UI / API path supports **one** line item (schema can hold more).  
- No update/delete invoice endpoints (outside assessment scope).  
- JWT kept in browser **`localStorage`** (per assessment client-token requirement); logout is client-side only.  
- No refresh-token or MFA flows.  

---

## Related reading

- [README.md](./README.md) — system overview  
- [01-architecture-and-stack.md](./01-architecture-and-stack.md)  
- [04-auth-and-session.md](./04-auth-and-session.md)  
- Root [README.md](../../README.md) — clone and quick start  
