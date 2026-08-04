# SimpleInvoice — Use Cases

This folder is the **product-facing** layer of the documentation. It describes what a signed-in user can do in SimpleInvoice and which business outcomes the system must guarantee. It deliberately avoids framework details (NestJS, Next.js, Prisma, Docker). Those belong in the technical-design layer.

Authoritative source of requirements: the 101 Digital Full Stack Assessment (SimpleInvoice). Technical choices that the assessment leaves open are recorded under `docs/technical-design/` once that layer exists.

---

## Product boundary

SimpleInvoice is a small invoicing console with four jobs:

1. Sign users in and keep unauthenticated traffic off the app.
2. Show a searchable, filterable, sortable, paginated invoice list as the home screen after login.
3. Open a single invoice and show its full commercial picture (customer, lines, amounts, status).
4. Create a new invoice with exactly one line item for this assessment.

Explicitly out of scope here: password complexity / MFA, editing or deleting invoices, multi-line create UI, real payments, email delivery, and third-party APIs.

---



## Actors


| Actor        | Meaning                                                                          |
| ------------ | -------------------------------------------------------------------------------- |
| **Guest**    | Not authenticated. May only use the login screen.                                |
| **User**     | Authenticated with a valid access token. May use list, detail, and create.       |
| **Reviewer** | A seeded User account provided so assessors can run the app without registering. |


Unless a use case says otherwise, steps labelled “User” assume a successful login.

---



## Catalog


| ID    | Name           | Document                                             | Intent                                                                    |
| ----- | -------------- | ---------------------------------------------------- | ------------------------------------------------------------------------- |
| UC-01 | Authentication | [UC-01-authentication.md](./UC-01-authentication.md) | Log in, keep a client-side token, bounce Guests to login.                 |
| UC-02 | Invoice list   | [UC-02-invoice-list.md](./UC-02-invoice-list.md)     | Browse invoices with search, status filter, sort, and server-side paging. |
| UC-03 | Invoice detail | [UC-03-invoice-detail.md](./UC-03-invoice-detail.md) | Inspect one invoice end-to-end.                                           |
| UC-04 | Create invoice | [UC-04-create-invoice.md](./UC-04-create-invoice.md) | Capture a Draft invoice with one line item and system-calculated totals.  |


Cross-cutting money and status rules that several use cases share live in [business-rules.md](./business-rules.md).

---



## How each use case is written

Each use-case file should stay short and testable. Prefer this skeleton:


| Section                   | Purpose                                                               |
| ------------------------- | --------------------------------------------------------------------- |
| **Goal**                  | One sentence outcome.                                                 |
| **Actors**                | Who starts the interaction.                                           |
| **Preconditions**         | What must already be true.                                            |
| **Main success scenario** | Numbered happy path.                                                  |
| **Extensions**            | Failures and alternate branches.                                      |
| **Business rules**        | Inline rules or pointers to `business-rules.md`.                      |
| **Acceptance checks**     | Observable “done when…” bullets for manual or automated verification. |


Describe screens, inputs, and system responses—not classes, hooks, or SQL.

---



## Suggested reading order

1. [business-rules.md](./business-rules.md) — totals, Overdue derivation, uniqueness, dates.
2. UC-01 → UC-02 → UC-03 → UC-04 — same order a user experiences the product.
3. Technical design — only when you need APIs, schema, or runtime topology.

---



## Document status


| Document                              | Status          |
| ------------------------------------- | --------------- |
| This README                           | Complete        |
| UC-01 … UC-04 and `business-rules.md` | Not written yet |


When the pending files are complete, this use-case set is sufficient to implement the four product flows and to run acceptance checks without reading the assessment PDF end-to-end again.