# SimpleInvoice — Technical design

This folder documents how the system is implemented: stack, repository layout, APIs, data model, authentication, frontend structure, and delivery (Docker, environment, tests).

Product behaviour and acceptance criteria are in [../use-cases/](../use-cases/). Start there for *what* the product must do; use this folder for *how* it is built.

Shared business rules (money, Overdue, uniqueness): [../use-cases/business-rules.md](../use-cases/business-rules.md).

---

## System overview

```text
Browser (Next.js App Router + Ant Design)
    |  HTTP + Bearer JWT (stored in localStorage)
    v
NestJS API (:3001)  — auth + invoices, validation, Swagger
    |  Prisma
    v
PostgreSQL (:5433 on host / :5432 in Compose)
```

| Layer | Stack | Responsibility |
| ----- | ----- | -------------- |
| Frontend | Next.js (App Router), React, TypeScript, Ant Design, TanStack Query, axios | Login, invoice list / detail / create; client-held JWT |
| Backend | NestJS, Prisma, class-validator, Passport JWT, Swagger | REST API; totals; Overdue derivation; route guards |
| Database | PostgreSQL | Users, customers, invoices, line items |
| Packaging | Root `docker-compose.yml` | Starts frontend, backend, and database together |

The assessment requires a React frontend and NestJS backend. This project uses **Next.js** as the React application framework. Invoice totals are calculated and stored by the **API**, not accepted as a client-computed source of truth ([UC-04](../use-cases/UC-04-create-invoice.md)).

---

## Repository layout

Monorepo with `backend/` and `frontend/` under one root:

```text
simple-invoice/
├── docker-compose.yml
├── README.md
├── docs/
│   ├── use-cases/
│   └── technical-design/
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── invoices/
│   │   ├── common/
│   │   └── prisma/
│   ├── prisma/
│   ├── docker/db/Dockerfile
│   ├── Dockerfile
│   └── test/
└── frontend/
    ├── src/
    │   ├── app/
    │   ├── components/
    │   └── lib/
    └── Dockerfile
```

Each Compose service has its own Dockerfile: `backend/Dockerfile`, `frontend/Dockerfile`, and `backend/docker/db/Dockerfile`.

---

## Running the stack

From the repository root:

```bash
docker compose up
```

| Service | URL |
| ------- | --- |
| Frontend | http://localhost:3000 |
| API | http://localhost:3001 |
| Swagger | http://localhost:3001/api/docs |
| Postgres | localhost:5433 |

Compose uses demo defaults suitable for local review. Optional overrides: root `.env` (see `backend/.env.example`). On backend start, migrations run and the database is seeded.

**Default login:** `reviewer@101digital.io` / `Password123!`

Running the API or UI with npm (without the full Compose stack): see the root [README.md](../../README.md) and [backend/README.md](../../backend/README.md).

---

## Use cases → code

| Use case | Primary implementation |
| -------- | ---------------------- |
| [UC-01 Authentication](../use-cases/UC-01-authentication.md) | `backend/src/auth/`, frontend `AppShell`, `lib/auth`, login page |
| [UC-02 Invoice list](../use-cases/UC-02-invoice-list.md) | `InvoicesService.findAll`, `frontend/src/app/invoices/page.tsx` |
| [UC-03 Invoice detail](../use-cases/UC-03-invoice-detail.md) | `InvoicesService.findOne` / `mapInvoice`, `frontend/src/app/invoices/[id]` |
| [UC-04 Create invoice](../use-cases/UC-04-create-invoice.md) | `InvoicesService.create`, `common/invoice-math`, `frontend/src/app/invoices/new` |
| Money & Overdue | `backend/src/common/invoice-math.ts` |

---

## Design decisions

| Topic | Decision |
| ----- | -------- |
| Packaging | Monorepo; `docker compose up` from the repo root starts frontend, API, and database |
| Frontend | Next.js App Router (React + TypeScript); application screens are client components |
| Customer | Separate `Customer` table; create upserts by email (case-insensitive) |
| Totals | Computed in `invoice-math` on the server; the create form may show a preview only |
| Overdue | Derived at read/filter time; never persisted |
| List filters Draft / Pending | Exclude past-due rows (those appear under Overdue) |
| Duplicate invoice number | Pre-check plus Prisma `P2002` → HTTP 409 |
| Auth token | JWT in `localStorage`; axios sends `Authorization: Bearer`; 401 clears the session |
| API documentation | Swagger UI at `/api/docs` |
| Default list `pageSize` | 15 (maximum 100) |

Further assumptions and known limitations: [backend/README.md](../../backend/README.md).

---

## Further reference

- [01-architecture-and-stack.md](./01-architecture-and-stack.md) — modules, request flows, trust boundaries  
- [02-data-model.md](./02-data-model.md) — entities, constraints, Appendix A mapping  
- [03-api-contract.md](./03-api-contract.md) — endpoints, payloads, errors  
- [04-auth-and-session.md](./04-auth-and-session.md) — JWT lifecycle, client storage, guards  
- [05-frontend.md](./05-frontend.md) — routes, shell, screens, data fetching  
- [06-devops-and-quality.md](./06-devops-and-quality.md) — Compose, env, seed, tests, limitations  
- Live API contract: Swagger UI at `/api/docs`

---

## Suggested reading order

1. [../use-cases/README.md](../use-cases/README.md) — product scope  
2. This document — overview and how to run  
3. [01-architecture-and-stack.md](./01-architecture-and-stack.md) — runtime structure  
4. [02-data-model.md](./02-data-model.md) — schema and constraints  
5. [03-api-contract.md](./03-api-contract.md) — HTTP contract  
6. [04-auth-and-session.md](./04-auth-and-session.md) — authentication and session  
7. [05-frontend.md](./05-frontend.md) — UI structure  
8. [06-devops-and-quality.md](./06-devops-and-quality.md) — delivery and quality  
9. Swagger (`/api/docs`) — interactive exploration 
