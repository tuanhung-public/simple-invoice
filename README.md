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

## Architecture / assumptions

See [`backend/README.md`](./backend/README.md).

## Known limitations

See [`backend/README.md`](./backend/README.md#known-limitations).
