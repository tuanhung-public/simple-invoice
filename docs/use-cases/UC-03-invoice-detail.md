# UC-03 — Invoice detail

## Goal

An authenticated User opens one invoice from the list and sees a complete, accurate commercial picture: invoice fields, customer, line items, amounts, outstanding balance, and display status.

## Actors

- **User** — authenticated; starts from Invoice List (UC-02) or a direct detail URL.
- **Guest** — must not stay on this screen (UC-01).

## Preconditions

- User is authenticated.
- The target invoice exists in the system (or the failure path applies).

## Main success scenario

1. From Invoice List, User selects an invoice (e.g. invoice number link).
2. System navigates to the **Invoice Detail** view for that invoice’s id.
3. System loads that invoice from the server (authenticated request).
4. User sees **invoice information** (at least identity/dates/currency; optional reference/description as stored).
5. User sees **customer information** (name, email; mobile/address when present).
6. User sees **line items** (name, quantity, rate; line amount may be shown as quantity × rate for readability).
7. User sees **amounts** sourced from the stored/server record: subtotal, tax, discount, **total**, **outstanding balance**.
8. User sees **invoice status** as the **display** status (including Overdue when derived).
9. All values match what the system stores / returns for that invoice (no client-side recalculation of invoice totals as source of truth).
10. User can navigate **back to Invoice List**.

## Extensions

### E1 — Invoice not found

- **When:** Id does not exist (or is not visible to the API).
- **Then:** User sees a clear not-found / error state and can return to the list. API responds with not-found (e.g. 404).

### E2 — Load failure / unauthorized

- **When:** Request fails (network, 401, 5xx).
- **Then:** User sees an error state; on 401, UC-01 E5 (clear session → Login).

### E3 — Empty optional fields

- **When:** Reference, description, mobile, or address is missing.
- **Then:** UI shows a neutral placeholder (e.g. N/A) rather than breaking the layout.

### E4 — Overdue display

- **When:** Invoice is unpaid and past due.
- **Then:** Detail shows status **Overdue** even though the database persisted status is Draft or Pending.

### E5 — Multiple line items in data

- **When:** The record has more than one line item (schema allows it; create UI may only add one).
- **Then:** Detail lists all returned items; amounts still come from the invoice totals on the server.

### E6 — Invalid or malformed id

- **When:** User opens a garbage id in the URL.
- **Then:** Prefer a controlled client error / not-found experience; API should not leave the User on a blank crash page.

### E7 — Unauthenticated access

- **When:** Guest opens a detail URL.
- **Then:** Redirect to Login (UC-01).

### E8 — Return to list with prior filters (value-add)

- **When:** User uses Back to Invoices after UC-02 restored list state.
- **Then:** List controls appear as left earlier (see UC-02 E8).

## Business rules

| ID    | Rule |
| ----- | ---- |
| BR-D1 | Detail is reached by selecting an invoice from the list (primary path). |
| BR-D2 | Displayed totals and balance must reflect server/stored values, not a FE “source of truth” recalculation of the invoice. |
| BR-D3 | Status on detail is display status (Overdue may be derived). |
| BR-D4 | Detail API requires authentication. |
| BR-D5 | Missing invoice → not-found behaviour for User and API. |

Shared money / Overdue rules: [business-rules.md](./business-rules.md) when available.

## Acceptance checks

- [ ] From list, User can open a detail page for a chosen invoice.
- [ ] Detail shows invoice information, customer, line items, subtotal, tax, discount, total, outstanding, status.
- [ ] Amounts match the API/stored invoice (spot-check against list total / create result).
- [ ] Overdue appears on detail when unpaid and past due.
- [ ] Unknown id shows not-found (UI + API 404).
- [ ] Optional empty fields do not break the page.
- [ ] Back navigates to Invoice List.
- [ ] Guest cannot use detail without auth.
- [ ] Loading state is shown while fetching.

## Out of scope

- Edit / delete invoice from detail.
- Recording payments / changing status on this screen.
- PDF print / email send.

## Traceability (assessment)

| Assessment item | Covered by |
| --------------- | ---------- |
| Navigate from list to detail | Steps 1–2, BR-D1 |
| Invoice + customer + line items | Steps 4–6 |
| Subtotal, tax, discount, total, outstanding, status | Steps 7–8 |
| Data reflects system record | Step 9, BR-D2 |
| GET `/invoices/:id` authenticated | BR-D4, E2, E7 |
