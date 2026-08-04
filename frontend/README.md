# SimpleInvoice Frontend

Next.js (App Router) + Ant Design frontend for SimpleInvoice.

> Full-stack Docker Compose lives in the **backend** repository and expects this repo as a sibling folder named `frontend`.

## Clone with backend (recommended)

```bash
mkdir simple-invoice && cd simple-invoice
git clone <BACKEND_REPO_URL> backend
git clone <FRONTEND_REPO_URL> frontend
cd backend
cp .env.example .env
docker compose up --build
```

App: http://localhost:3000  
Login: `reviewer@101digital.io` / `Password123!`

## Run locally (backend already running)

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
