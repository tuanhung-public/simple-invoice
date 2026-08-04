# 03 — API contract

HTTP surface of the NestJS API: endpoints, authentication, request/response shapes, and error codes.

Interactive reference (when the API is running): **http://localhost:3001/api/docs**

Base URL (local default): `http://localhost:3001`

---

## Conventions

| Topic | Behaviour |
| ----- | --------- |
| Protocol | JSON over HTTP |
| Auth header | `Authorization: Bearer <accessToken>` |
| Dates | `YYYY-MM-DD` strings for invoice/due/from/to dates |
| Money | Numbers (two decimal places after server rounding) |
| Validation | Global `ValidationPipe` (`whitelist`, `transform`, `forbidNonWhitelisted`) |
| Errors | `{ "statusCode", "message", "error" }` — `message` may be a string or string array |

---

## Endpoint summary

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| `POST` | `/auth/login` | No | Authenticate; return JWT |
| `GET` | `/auth/me` | Yes | Current user profile |
| `GET` | `/invoices` | Yes | List with search, filter, sort, pagination |
| `GET` | `/invoices/:id` | Yes | Invoice detail (UUID v4) |
| `POST` | `/invoices` | Yes | Create invoice (Draft, one line item) |

---

## Auth

### `POST /auth/login`

**Body**

| Field | Type | Rules |
| ----- | ---- | ----- |
| `email` | string | Required; valid email |
| `password` | string | Required; min length 6 |

**Success — `201 Created`**

```json
{
  "accessToken": "<jwt>",
  "user": {
    "id": "ad1e0902-1928-4345-b513-60c86c94fc91",
    "email": "reviewer@101digital.io",
    "fullname": "101 Digital Reviewer"
  }
}
```

**Errors**

| Status | When |
| ------ | ---- |
| `400` | Validation failed (invalid email, empty password, …) |
| `401` | Unknown user or wrong password (`Invalid email or password`) |

Token expiry is controlled by `JWT_EXPIRES_IN` (seconds; default **3600**).

---

### `GET /auth/me`

Requires Bearer token.

**Success — `200 OK`**

```json
{
  "id": "…",
  "email": "reviewer@101digital.io",
  "fullname": "101 Digital Reviewer",
  "createdAt": "…"
}
```

**Errors:** `401` if missing/invalid/expired token.

---

## Invoices

All `/invoices` routes require Bearer JWT (`401` if absent/invalid).

### `GET /invoices`

**Query parameters**

| Param | Type | Default | Notes |
| ----- | ---- | ------- | ----- |
| `page` | number | `1` | ≥ 1 |
| `pageSize` | number | `15` | 1–100 |
| `sortBy` | string | `invoiceDate` | `invoiceDate` \| `dueDate` \| `totalAmount` |
| `ordering` | string | `DESC` | `ASC` \| `DESC` |
| `status` | string | — | `Draft` \| `Pending` \| `Paid` \| `Overdue` |
| `keyword` | string | — | Partial, case-insensitive match on invoice number **or** customer name |
| `fromDate` | string | — | Invoice date on/after (`YYYY-MM-DD`) |
| `toDate` | string | — | Invoice date on/before (`YYYY-MM-DD`, inclusive full UTC day) |

**Status filter semantics** (see [business-rules](../use-cases/business-rules.md)):

- `Overdue` — not Paid and `dueDate` before today  
- `Draft` / `Pending` — that persisted status and **not** past due  
- `Paid` — persisted Paid  

**Success — `200 OK`**

```json
{
  "data": [ /* Invoice objects — see below */ ],
  "paging": {
    "page": 1,
    "pageSize": 15,
    "total": 100
  }
}
```

**Errors**

| Status | When |
| ------ | ---- |
| `400` | Invalid query (e.g. `fromDate` after `toDate`, bad enum) |
| `401` | Unauthorized |

---

### `GET /invoices/:id`

`:id` must be a **UUID v4** (`ParseUUIDPipe`).

**Success — `200 OK`** — single Invoice object (shape below).

**Errors**

| Status | When |
| ------ | ---- |
| `400` | `:id` is not a UUID v4 |
| `401` | Unauthorized |
| `404` | Invoice not found (`Invoice not found`) |

---

### `POST /invoices`

Creates a **Draft** invoice with **one** line item. Totals are computed on the server (`taxPercent` default **10**, `discount` default **0**). Do not send pre-computed total fields as source of truth.

**Body**

| Field | Type | Rules |
| ----- | ---- | ----- |
| `customerName` | string | Required; non-empty (trimmed) |
| `customerEmail` | string | Required; valid email (trimmed) |
| `customerMobile` | string | Optional |
| `customerAddress` | string | Optional |
| `invoiceNumber` | string | Required; unique |
| `invoiceReference` | string | Optional |
| `invoiceDate` | string | Required; ISO date |
| `dueDate` | string | Required; on or after `invoiceDate` |
| `currency` | string | Required; `AUD` \| `USD` \| `GBP` \| `EUR` \| `SGD` \| `VND` |
| `description` | string | Optional |
| `item` | object | Required — see below |
| `taxPercent` | number | Optional; ≥ 0; ≤ 1000; default 10 |
| `discount` | number | Optional; ≥ 0; default 0; must not make total &lt; 0 |

**`item`**

| Field | Type | Rules |
| ----- | ---- | ----- |
| `name` | string | Required |
| `quantity` | integer | ≥ 1 |
| `rate` | number | ≥ 0.01 |

**Success — `201 Created`** — Invoice object (includes calculated amounts, `status` often `Draft`, or `Overdue` if unpaid and past due after mapping).

**Errors**

| Status | When |
| ------ | ---- |
| `400` | Validation / due date / discount exceeds subtotal + tax |
| `401` | Unauthorized |
| `409` | Duplicate `invoiceNumber` (`Invoice number must be unique`) |

---

## Invoice response object

Used in list `data[]`, detail, and create responses:

```json
{
  "invoiceId": "099ca7da-a290-40fa-93b9-1c43ae7bb887",
  "invoiceNumber": "IV1780488206995",
  "invoiceReference": "#5721662",
  "invoiceDate": "2026-06-03",
  "dueDate": "2026-07-03",
  "currency": "AUD",
  "currencySymbol": "AU$",
  "description": "Invoice is issued to Kanglee",
  "status": "Overdue",
  "invoiceSubTotal": 2000,
  "totalTax": 200,
  "totalDiscount": 20,
  "totalAmount": 2180,
  "totalPaid": 1451.34,
  "balanceAmount": 728.66,
  "createdAt": "2026-06-03T12:03:26.995Z",
  "createdBy": "ad1e0902-1928-4345-b513-60c86c94fc91",
  "customer": {
    "fullname": "Paul",
    "email": "paul@101digital.io",
    "mobileNumber": "947717364111",
    "address": "Singapore"
  },
  "items": [
    {
      "id": "b1c2d3e4-0000-0000-0000-000000000001",
      "name": "Honda RC150",
      "quantity": 2,
      "rate": 1000
    }
  ]
}
```

`status` is the **display** status (`Draft` \| `Pending` \| `Paid` \| `Overdue`). See [02-data-model.md](./02-data-model.md).

---

## Error body examples

**Validation (`400`)**

```json
{
  "statusCode": 400,
  "message": ["dueDate must be on or after invoiceDate"],
  "error": "Bad Request"
}
```

**Not found (`404`)**

```json
{
  "statusCode": 404,
  "message": "Invoice not found",
  "error": "Not Found"
}
```

**Conflict (`409`)**

```json
{
  "statusCode": 409,
  "message": "Invoice number must be unique",
  "error": "Conflict"
}
```

---

## Use case mapping

| Use case | Endpoints |
| -------- | --------- |
| [UC-01](../use-cases/UC-01-authentication.md) | `POST /auth/login`, `GET /auth/me` |
| [UC-02](../use-cases/UC-02-invoice-list.md) | `GET /invoices` |
| [UC-03](../use-cases/UC-03-invoice-detail.md) | `GET /invoices/:id` |
| [UC-04](../use-cases/UC-04-create-invoice.md) | `POST /invoices` |

---

## Related reading

- [01-architecture-and-stack.md](./01-architecture-and-stack.md)  
- [02-data-model.md](./02-data-model.md)  
- Swagger UI: `/api/docs`  
