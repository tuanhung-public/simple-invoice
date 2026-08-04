# SimpleInvoice

Full-stack invoice demo: **NestJS** backend + **Next.js** frontend.

| Folder | Role |
|--------|------|
| [`backend/`](./backend) | NestJS API, Prisma, Docker Compose (Postgres) |
| [`frontend/`](./frontend) | Next.js UI |
| [`docs/`](./docs) | Use-case notes |

## Quick start (Docker)

```bash
git clone https://github.com/tuanhung-public/simple-invoice.git
cd simple-invoice
cp backend/.env.example backend/.env
docker compose --env-file backend/.env up --build
```

Or from `backend/` (canonical compose file lives there too):

```bash
cd backend
cp .env.example .env
docker compose up --build
```

- API: `http://localhost:3001` (Swagger `/docs`)
- Web: `http://localhost:3000`

**Do not commit `backend/.env` or `frontend/.env.local`.** Use the `.env.example` files.

## Default login

- `reviewer@101digital.io` / `Password123!`

## Local frontend (optional)

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

## Tests

```bash
# Backend unit
cd backend && npm test

# Backend e2e (DB up + migrated + seeded)
cd backend && docker compose up -d db && npx prisma migrate deploy && npm run seed && npm run test:e2e

# Frontend
cd frontend && npm test
```

## Known limitations

See [`backend/README.md`](./backend/README.md#known-limitations).
