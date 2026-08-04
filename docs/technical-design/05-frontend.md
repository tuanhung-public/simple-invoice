# 05 — Frontend

How the Next.js UI is organized: routes, shell, data fetching, and the screens that implement the four use cases.

Auth storage details: [04-auth-and-session.md](./04-auth-and-session.md).  
API usage: [03-api-contract.md](./03-api-contract.md).

---

## Stack and role

| Piece | Choice |
| ----- | ------ |
| Framework | Next.js 15 App Router, React 19, TypeScript |
| UI | Ant Design 6 + shared `globals.css` |
| Server state | TanStack Query |
| HTTP | axios (`lib/api.ts`) with Bearer interceptor |
| Dates | dayjs |

The assessment requires a **React + TypeScript** frontend. Next.js hosts that app. Invoice **totals are not trusted from the client** as source of truth; create may show a labelled **preview**, while persisted amounts come from the API.

Application screens are **client components**. Next provides routing, root layout, fonts, and production build; domain data is loaded from the Nest API in the browser.

---

## Directory map

```text
frontend/src/
├── app/
│   ├── layout.tsx          # Providers + AppShell
│   ├── page.tsx            # `/` — client redirect via AppShell
│   ├── login/page.tsx      # UC-01
│   ├── invoices/
│   │   ├── page.tsx        # UC-02 list
│   │   ├── [id]/page.tsx   # UC-03 detail
│   │   └── new/page.tsx    # UC-04 create
│   └── globals.css
├── components/
│   ├── AppShell.tsx        # Auth gate, nav, logout, profile
│   └── Providers.tsx       # React Query + Ant Design theme
└── lib/
    ├── api.ts              # axios + invoice/auth API helpers
    ├── auth.ts             # token + redirect helpers
    ├── list-params.ts      # GET /invoices query builder
    ├── invoices-list-state.ts  # session restore for list controls
    ├── create-invoice-payload.ts
    └── create-invoice-defaults.ts
```

Environment: `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`).

---

## Routes

| Path | Screen | Notes |
| ---- | ------ | ----- |
| `/` | Home | Renders nothing visible; `AppShell` sends Guests to `/login` and Users to `/invoices` (avoids flashing the list for Guests) |
| `/login` | Login | Public; authenticated users are sent to `/invoices` |
| `/invoices` | Invoice list | Default home after login |
| `/invoices/[id]` | Invoice detail | UUID from list links |
| `/invoices/new` | Create invoice | Single line item |

---

## Shell and providers

`layout.tsx` wraps every page with:

1. **AntdRegistry** — Ant Design + Next App Router  
2. **Providers** — React Query client + Ant Design `ConfigProvider` / `App`  
3. **AppShell** — auth redirect, top nav (Invoices / Create), user chip from `GET /auth/me`, logout  

Protected routes require a token in `localStorage`. Axios adds `Authorization: Bearer …` and clears the session on **401**.

---

## Data access pattern

```text
Page / form
  → React Query (list, detail, me) or direct mutation (login, create)
  → lib/api.ts (axios)
  → NestJS API
```

- **List / detail / me:** `useQuery` with stable `queryKey`s (e.g. `['invoices', params]`, `['invoice', id]`).  
- **Login / create:** imperative calls; create shows Ant Design success/error messages then navigates.  
- List uses `keepPreviousData` so pagination/filter changes keep prior rows visible while loading.

---

## Screen behaviour

### Login ([UC-01](../use-cases/UC-01-authentication.md))

- Email + password fields with client validation (required, email format, password min length).  
- On success: store JWT, `replace` → `/invoices`.  
- On failure: inline error alert; no token stored.

### Invoice list ([UC-02](../use-cases/UC-02-invoice-list.md))

- Columns: Invoice #, Customer, Invoice Date, Due Date, Total, Status (display status including Overdue).  
- **Search** — invoice # or customer name (applied on Enter / blur).  
- **Status pills** — All, Paid, Overdue, Pending, Draft.  
- **Sort** — invoiceDate, dueDate, totalAmount (ASC/DESC) via table headers.  
- **Pagination** — server-side; configurable page size (15 / 30 / 50).  
- **Date range** (optional) — `fromDate` / `toDate` on invoice date; invalid range blocked in UI.  
- Row link → detail; primary CTA → create.  
- List control state is restored from **sessionStorage** when returning from detail/create.

Query strings are built by `buildInvoiceListParams` to match [03-api-contract.md](./03-api-contract.md).

### Invoice detail ([UC-03](../use-cases/UC-03-invoice-detail.md))

- Loads `GET /invoices/:id`.  
- Shows invoice fields, customer, line items, subtotal / tax / discount / total / outstanding, status badge.  
- Amounts rendered from the API response (not recalculated as source of truth).  
- Loading spinner; not-found / error alert with back link to the list.

### Create invoice ([UC-04](../use-cases/UC-04-create-invoice.md))

- Form covers assessment fields (plus optional reference/description).  
- Client validation: required fields, email, due date ≥ invoice date, positive qty/rate.  
- Maps to API body via `buildCreateInvoicePayload` (defaults tax **10%**, discount **0**); **does not send** client totals as authoritative fields.  
- UI may show **“Preview — final totals from server”** while editing.  
- On success: toast + navigate to `/invoices`.  
- Duplicate number / validation errors surface API `message`.  
- Demo pre-fill helpers exist for reviewer convenience; submit still validates.

---

## Responsiveness

Layout and table behaviour target both desktop and narrower viewports (filter bar wrap, horizontal table scroll, stacked create/detail cards via CSS). Styling combines Ant Design components with project CSS in `globals.css`.

---

## Testing

```bash
cd frontend && npm test
```

Vitest + Testing Library cover auth helpers, login validation, list smoke rendering, create field validation / payload mapping, and list-state helpers. Full browser e2e of the UI is optional; API workflow e2e lives in the backend package.

---

## Related reading

- [01-architecture-and-stack.md](./01-architecture-and-stack.md)  
- [04-auth-and-session.md](./04-auth-and-session.md)  
- Frontend package README: `frontend/README.md`  
