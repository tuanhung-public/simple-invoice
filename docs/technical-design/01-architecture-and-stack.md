# 01 — Architecture and stack

How the SimpleInvoice runtime is structured: technology choices, module boundaries, and the main request paths that implement the use cases.

Companion overview: [README.md](./README.md). Product behaviour: [../use-cases/](../use-cases/).

---

## Goals of this architecture

- Satisfy the assessment stack: **React + TypeScript** UI, **NestJS + TypeScript** API, relational database (**PostgreSQL**).
- Keep **business totals and Overdue derivation on the server**.
- Ship a **single Compose command** that starts frontend, backend, and database.
- Keep modules small and aligned to the four product flows (auth, list, detail, create).

---

## Stack

| Concern | Technology | Notes |
| ------- | ---------- | ----- |
| UI framework | Next.js 15 (App Router) | React 19 + TypeScript; assessment-compatible React host |
| UI kit | Ant Design 6 | Forms, table, layout |
| Client data | TanStack Query + axios | Server state for list/detail; HTTP client with JWT interceptor |
| API framework | NestJS 11 | Modular controllers/services |
| Validation | class-validator + class-transformer | Global `ValidationPipe` (whitelist, transform) |
| Auth | Passport JWT + bcrypt | Stateless access tokens; passwords hashed at rest |
| ORM | Prisma 6 | Schema, migrations, seed |
| Database | PostgreSQL 16 | Primary store |
| API docs | `@nestjs/swagger` | UI at `/api/docs` |
| FE tests | Vitest + Testing Library | Unit / component tests |
| BE tests | Jest + Supertest | Unit tests + e2e workflow |
| Containers | Docker Compose | Root compose file; one Dockerfile per service |

---

## Runtime topology

```text
                    ┌─────────────────────────────────────┐
                    │  Browser                            │
                    │  Next.js (:3000)                    │
                    │  AppShell · pages · axios + React Query │
                    └─────────────────┬───────────────────┘
                                      │ JSON REST
                                      │ Authorization: Bearer <JWT>
                    ┌─────────────────▼───────────────────┐
                    │  NestJS (:3001)                     │
                    │  AuthModule · InvoicesModule        │
                    │  PrismaModule · global pipes/filters│
                    └─────────────────┬───────────────────┘
                                      │ Prisma Client
                    ┌─────────────────▼───────────────────┐
                    │  PostgreSQL                         │
                    │  host :5433 → container :5432       │
                    └─────────────────────────────────────┘
```

Default ports and login credentials are listed in [README.md](./README.md).

---

## Backend module boundaries

`AppModule` wires configuration and three feature areas:

| Module | Responsibility |
| ------ | -------------- |
| `ConfigModule` (global) | Environment variables (`DATABASE_URL`, `JWT_*`, `CORS_ORIGIN`, `PORT`, …) |
| `PrismaModule` | Shared `PrismaService` for database access |
| `AuthModule` | `POST /auth/login`, `GET /auth/me`, JWT signing/validation, bcrypt verify |
| `InvoicesModule` | List / detail / create invoices; applies JWT guard on invoice routes |

Cross-cutting backend pieces under `backend/src/common/`:

| Piece | Role |
| ----- | ---- |
| `invoice-math.ts` | Totals formula, Overdue derivation, due-date assertion, money rounding |
| `filters/all-exceptions.filter.ts` | Consistent `{ statusCode, message, error }` responses |
| `dto/api-responses.dto.ts` | Swagger response shapes |

Bootstrap (`main.ts`): CORS from env, global validation pipe, global exception filter, Swagger at `/api/docs`.

Persistence and seed scripts live under `backend/prisma/` (see data-model documentation when present; schema file: `backend/prisma/schema.prisma`).

---

## Frontend structure

| Area | Location | Role |
| ---- | -------- | ---- |
| Routes | `frontend/src/app/` | `/login`, `/invoices`, `/invoices/[id]`, `/invoices/new`; `/` redirects to `/invoices` |
| Shell | `components/AppShell.tsx` | Auth gate, nav, logout, profile (`/auth/me`) |
| Providers | `components/Providers.tsx` | React Query + Ant Design theme |
| HTTP | `lib/api.ts` | Axios instance, Bearer attach, 401 → clear token + login |
| Auth helpers | `lib/auth.ts` | Token get/set/clear, redirect rules |
| List helpers | `lib/list-params.ts`, `lib/invoices-list-state.ts` | Query param builder; persist list controls across navigation |
| Create helpers | `lib/create-invoice-payload.ts`, `lib/create-invoice-defaults.ts` | Map form → API body; demo initial values |

Application screens are **client components**. The Next.js server is used for routing, layout, and production build; invoice data is loaded from the Nest API in the browser.

---

## Request flows

### Authenticated page load

1. User opens a protected route (e.g. `/invoices`).
2. `AppShell` checks for a JWT in `localStorage`.
3. Missing token → redirect to `/login`.
4. Present token → render shell; optionally load `/auth/me` for the header.
5. Page components fetch domain data via axios + React Query with the Bearer header.

### Login ([UC-01](../use-cases/UC-01-authentication.md))

1. UI posts email/password to `POST /auth/login`.
2. API verifies credentials, returns `{ accessToken, user }`.
3. Client stores the token and navigates to `/invoices`.

### Invoice list ([UC-02](../use-cases/UC-02-invoice-list.md))

1. UI calls `GET /invoices` with page, pageSize, sort, status, keyword, optional date range.
2. API applies filters (including Overdue semantics), sorts, paginates in PostgreSQL.
3. Each row is mapped with **display** status before return.
4. UI renders the table; opening a row goes to detail.

### Invoice detail ([UC-03](../use-cases/UC-03-invoice-detail.md))

1. UI calls `GET /invoices/:id` (UUID).
2. API loads invoice + customer + items, or 404.
3. Response includes server-stored amounts and derived status.

### Create invoice ([UC-04](../use-cases/UC-04-create-invoice.md))

1. UI validates the form and posts a body **without** client-authored totals as source of truth.
2. API validates DTO, checks uniqueness and dates, runs `calculateInvoiceTotals`, persists **Draft** + one line item.
3. On success, UI notifies and returns to the list.

---

## Trust boundaries

| Boundary | Rule |
| -------- | ---- |
| Browser → API | All `/invoices/*` and `/auth/me` require a valid JWT (except `POST /auth/login`). |
| Totals | Server computes and stores monetary fields; create UI preview is informational. |
| Status | Only Draft / Pending / Paid are stored; Overdue is computed when reading or filtering. |
| Secrets | JWT secret and database credentials come from environment / Compose; not hard-coded in source. |

---

## Why these choices

| Choice | Rationale |
| ------ | --------- |
| Monorepo + root Compose | One clone, one `docker compose up` for reviewers |
| Next.js | File-based routing and TypeScript React app with standard tooling |
| NestJS modules | Clear split between auth and invoices; fits assessment “clean modular” expectation |
| Prisma + PostgreSQL | Typed schema, migrations, seed script (`npm run seed`) |
| Shared `invoice-math` | Single implementation for create, tests, and Overdue rules |

---

## Related reading

- [README.md](./README.md) — run instructions and decision summary  
- [../use-cases/business-rules.md](../use-cases/business-rules.md) — money and status rules  
- Swagger: `http://localhost:3001/api/docs`  
- Schema: `backend/prisma/schema.prisma`  
