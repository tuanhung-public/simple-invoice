# Business rules (cross-cutting)

Shared rules used by more than one use case. Product-facing only — no Nest/Next/Prisma detail.

## Money

```
subTotal      = quantity × rate
taxAmount     = subTotal × (tax% / 100)
totalAmount   = subTotal + taxAmount − discount
balanceAmount = totalAmount − totalPaid
```

- Amounts are rounded to currency cents in implementation; behaviour must stay consistent between create and later reads.
- **Source of truth for persisted invoice totals is the server** (UC-04). List/detail must show those stored/server values (UC-02, UC-03).
- On create, `totalPaid` starts at **0**, so outstanding balance equals `totalAmount`.
- Discount must not push `totalAmount` below zero (reject or block).
- Tax % is allowed in **0–1000** (inclusive); default **10** when omitted on create.

## Status

**Persisted in storage:** `Draft`, `Pending`, `Paid` only.

**Display status Overdue (derived at read time):**

- If persisted status is not `Paid` **and** due date is before today → show **Overdue**.
- Otherwise show the persisted status.
- Overdue is **never written** as a stored status.

**List filter implications (UC-02):**

- Filter **Overdue** → unpaid and past due.
- Filter **Draft** / **Pending** → that persisted status **and** not past due (past-due rows appear under Overdue).

## Dates

- Due date must be **on or after** invoice date (create + any server check).
- “Today” for Overdue is a calendar-day comparison (UTC day boundaries in the current backend).

## Uniqueness

- `invoiceNumber` must be unique system-wide (UC-04).

## Auth

- Invoice list, detail, and create require a valid access token (UC-01).
- Reviewer seed account exists for assessment login.

## Seed / demo data

- Seed includes structured sample data (Appendix A style) plus enough extra invoices (~20–50) for search/filter/sort/pagination demos.
- Seed must not persist status `Overdue`; Overdue appears only via derivation.
