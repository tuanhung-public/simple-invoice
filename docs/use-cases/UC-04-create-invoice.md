# UC-04 — Create invoice

## Goal

An authenticated User creates a new invoice with exactly one line item; the system stores it as **Draft**, enforces uniqueness and date rules, **calculates totals on the server**, then confirms success and returns the User to the Invoice List.

## Actors

- **User** — authenticated; opens Create from the list or nav.
- **Guest** — redirected to Login (UC-01).

## Preconditions

- User is authenticated.
- Create screen is reachable (e.g. from Invoice List CTA or Create nav).

## Main success scenario

1. User opens **Create Invoice**.
2. User fills the form fields required by the product (customer, invoice identity/dates/currency, one line item, tax/discount as applicable).
3. Client validates required fields and basic formats (email, due date on/after invoice date, positive qty/rate, etc.).
4. User submits.
5. Server validates the payload, ensures **invoice number is unique**, ensures **due date ≥ invoice date**, and **calculates** subtotal, tax, discount, total, and balance (with `totalPaid = 0` for a new invoice).
6. System persists the invoice with status **Draft** and exactly **one** line item for this assessment flow.
7. Client shows a **success** notification.
8. Client navigates to **Invoice List**; the new invoice can appear under list/search (subject to filters).

## Extensions

### E1 — Client validation failure

- **When:** Required fields empty, invalid email, due date before invoice date, qty/rate invalid, etc.
- **Then:** Client shows field errors; **no** successful create call (or server is not relied upon for that check).

### E2 — Server validation failure (400)

- **When:** Payload fails server rules (including due date / discount constraints).
- **Then:** User sees an error message from the API; invoice is not created; User remains on Create (or can correct and retry).

### E3 — Duplicate invoice number (409)

- **When:** Invoice number already exists.
- **Then:** System rejects with a clear unique-number error; no duplicate row; User can change the number and retry.

### E4 — Defaults for tax and discount

- **When:** User omits tax % and/or discount.
- **Then:** System applies **tax 10%** and **discount 0** (unless the User explicitly sets other values in range).

### E4b — Tax % out of range

- **When:** Tax % is below **0** or above **1000**.
- **Then:** Client and/or server reject the value; invoice is not created.

### E5 — Preview totals on the form (value-add)

- **When:** UI shows running subtotal/tax/discount/total while editing.
- **Then:** That preview is **informational only**. Persisted totals come from the **server** calculation after create (and on later read).

### E6 — Past due date on a new Draft

- **When:** User sets a due date before today (but still ≥ invoice date).
- **Then:** Create may still succeed as **Draft**; on list/detail the **display** status may show **Overdue** (derived). Product may warn the User; warning is optional value-add.

### E7 — Unauthorized / session expired

- **When:** Token missing or rejected on POST.
- **Then:** UC-01 E5 (clear session → Login); invoice not created.

### E8 — Cancel / back

- **When:** User cancels or goes back to Invoices without submitting successfully.
- **Then:** No new invoice is created from that attempt.

### E9 — Only one line item in the create UI

- **When:** User creates via this assessment UI.
- **Then:** Exactly one line item is submitted. Schema may allow more later; multi-line create UI is out of scope.

## Business rules

| ID    | Rule |
| ----- | ---- |
| BR-C1 | New invoices are created with status **Draft**. |
| BR-C2 | Invoice number is user-provided and **unique**. |
| BR-C3 | Due date must be **on or after** invoice date (client + server). |
| BR-C4 | **Totals are calculated on the backend**, not trusted from the client as source of truth. |
| BR-C5 | Tax defaults to **10%** (range **0–1000%**); discount defaults to **0**; both non-negative. |
| BR-C6 | Create supports **one** line item in this assessment. |
| BR-C7 | After success: notification + redirect to Invoice List. |
| BR-C8 | Create API requires authentication. |

Field-level validation table (assessment):

| Field | Rule |
| ----- | ---- |
| Customer name | Required, non-empty |
| Customer email | Required, valid email |
| Customer mobile | Optional |
| Customer address | Optional |
| Invoice number | Required, unique |
| Invoice date | Required, valid date |
| Due date | Required, ≥ invoice date |
| Currency | Required (e.g. AUD, USD, GBP) |
| Item name | Required |
| Item quantity | Required, positive integer |
| Item rate | Required, positive number |
| Tax (%) | **0–1000%**; default 10% |
| Discount | Optional; non-negative; default 0 |

Shared formulas / Overdue: see [business-rules.md](./business-rules.md).

## Acceptance checks

- [ ] Create screen exposes the required fields (and optional mobile/address/tax/discount as specified).
- [ ] Client validation blocks empty/invalid required input.
- [ ] Due date before invoice date is rejected (client and/or server).
- [ ] Successful create stores **Draft** with one line item.
- [ ] Totals on the saved invoice match server formula (not a client-posted total field).
- [ ] Duplicate invoice number is rejected clearly.
- [ ] Tax/discount defaults apply when omitted; tax outside **0–1000%** is rejected.
- [ ] Success toast/notification appears; User lands on Invoice List.
- [ ] New invoice is retrievable via list/detail.
- [ ] Guest cannot create without auth.
- [ ] (Value-add) Form preview totals do not replace server calculation.
- [ ] (Value-add) Demo pre-fill does not remove validation on submit.

## Out of scope

- Multi-line item editor on create.
- Creating as Pending/Paid directly.
- Edit after create; recording payments on create.
- Advanced tax jurisdictions / multi-currency conversion.

## Traceability (assessment)

| Assessment item | Covered by |
| --------------- | ---------- |
| Create screen / one line item | Steps 1–2, E9, BR-C6 |
| Status Draft | Step 6, BR-C1 |
| Unique user-provided invoice number | Step 5, E3, BR-C2 |
| Validation table | Field table, E1–E2 |
| Success notification + redirect list | Steps 7–8, BR-C7 |
| Totals calculated by backend | Step 5, BR-C4, E5 |
| POST `/invoices` authenticated | BR-C8, E7 |
