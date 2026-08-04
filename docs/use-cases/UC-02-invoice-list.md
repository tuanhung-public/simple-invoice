# UC-02 — Invoice list

## Goal

An authenticated User browses invoices on the home screen with search, status filter, sort, and server-side pagination, then opens a row to see detail or starts create.

## Actors

- **User** — authenticated (see [UC-01](./UC-01-authentication.md)).
- **Guest** — must not reach this screen (redirect to Login).

## Preconditions

- User is authenticated with a valid access token.
- The system has invoice data available for browsing (seeded and/or previously created).

## Main success scenario

1. After login (or navigation to home), User lands on **Invoice List**.
2. System loads a **page** of invoices from the server using the current filters/sort/page size.
3. For each row, User sees at least: **Invoice Number**, **Customer Name**, **Invoice Date**, **Due Date**, **Total Amount**, **Status** (display status, including Overdue when applicable).
4. User may **search** by invoice number or customer name (partial, case-insensitive).
5. User may **filter** by status: Draft, Pending, Paid, Overdue (or clear to show all).
6. User may **sort** by Invoice Date, Due Date, or Total Amount (ascending or descending).
7. User may change **page** and **page size**; only the requested page is fetched from the server.
8. User selects an invoice number / row link and navigates to **Invoice Detail** (UC-03).
9. User may open **Create Invoice** from this screen (UC-04).

## Extensions

### E1 — Empty result set

- **When:** Filters/search yield no rows.
- **Then:** List shows an empty state; paging total is 0; User can clear filters and try again.

### E2 — Load / API failure

- **When:** The list request fails (network, 401, 5xx).
- **Then:** User sees a clear failure/empty messaging; on 401, UC-01 E5 applies (back to Login).

### E3 — Search apply

- **When:** User enters a keyword and confirms (e.g. Enter) or leaves the field after changing it.
- **Then:** Page resets to 1; server receives the trimmed keyword; matching is partial and case-insensitive on invoice number **or** customer name.

### E4 — Status filter vs Overdue

- **When:** User filters by **Overdue**.
- **Then:** Only invoices whose **display** status is Overdue appear (unpaid and past due).
- **When:** User filters by **Draft** or **Pending**.
- **Then:** Rows are those persisted statuses that are **not** past due (past-due drafts/pendings appear under Overdue, not under Draft/Pending).

### E5 — Sort clear / default

- **When:** User clears column sort UI.
- **Then:** List still has a deterministic server order (default: invoice date descending is acceptable).

### E6 — Pagination bounds

- **When:** User changes page size or filters while on a high page number.
- **Then:** Page resets to 1 when filters/search/page size/status/date range change so the User is not left on an empty high page.

### E7 — Optional invoice date range (value-add)

- **When:** User sets from/to invoice dates.
- **Then:** Only invoices with invoice date in range are returned; invalid range (from after to) is rejected or blocked with feedback.
- **Note:** Assessment query params allow `fromDate` / `toDate`; UI support is a value-add.

### E8 — Return from detail/create (value-add)

- **When:** User goes to detail or create and comes back to the list.
- **Then:** Previous list controls (page, filters, sort, search) are restored when the product supports session restore.

### E9 — Unauthenticated access

- **When:** Guest opens the list URL.
- **Then:** Redirect to Login (UC-01 E3).

## Business rules

| ID    | Rule |
| ----- | ---- |
| BR-L1 | Invoice List is the **default home** after successful login. |
| BR-L2 | Pagination is **server-side**; page size is configurable. |
| BR-L3 | Search is partial + case-insensitive on invoice number or customer name. |
| BR-L4 | Status filter values: Draft, Pending, Paid, Overdue. |
| BR-L5 | Sort fields: invoiceDate, dueDate, totalAmount; ASC or DESC. |
| BR-L6 | Status shown in the list is the **display** status (Overdue may be derived; see business-rules when available). |
| BR-L7 | List API requires authentication. |

Money formulas and Overdue derivation details belong in [business-rules.md](./business-rules.md) (when written); this UC only requires correct **display** and **filter** behaviour.

## Acceptance checks

- [ ] After login, User lands on Invoice List.
- [ ] Columns include Invoice #, Customer, Invoice Date, Due Date, Total, Status.
- [ ] Search by partial invoice # or customer name works (case-insensitive).
- [ ] Status pills/filter cover All + Draft, Pending, Paid, Overdue.
- [ ] Filtering Overdue shows past-due unpaid invoices.
- [ ] Filtering Draft/Pending does not list past-due rows of those statuses (they show under Overdue).
- [ ] Sorting by invoiceDate, dueDate, totalAmount works ASC and DESC.
- [ ] Changing page fetches another server page; page size can be changed.
- [ ] Response shape conceptually matches paged list (`data` + paging totals).
- [ ] Clicking an invoice opens Detail.
- [ ] Create Invoice is reachable from the list.
- [ ] Guest cannot stay on the list without auth.
- [ ] Empty and error states are understandable.
- [ ] (Value-add) Invoice date range filter works; invalid range is handled.
- [ ] (Value-add) List state survives navigate away and back.

## Out of scope

- Bulk edit/delete, export, column customization.
- Client-side-only pagination of the full dataset.
- Multi-select or invoice status change from the list.

## Traceability (assessment)

| Assessment item | Covered by |
| --------------- | ---------- |
| Default home after login | Main step 1, BR-L1 |
| Key columns | Step 3 |
| Search (partial, case-insensitive) | Step 4, E3, BR-L3 |
| Filter Draft/Pending/Paid/Overdue | Step 5, E4, BR-L4 |
| Sort invoiceDate/dueDate/totalAmount ASC/DESC | Step 6, BR-L5 |
| Server-side pagination + configurable page size | Step 7, BR-L2 |
| Navigate to detail | Step 8 |
| Query params page, pageSize, sortBy, ordering, status, keyword, fromDate, toDate | Steps 4–7, E7 |
| Auth on list API | BR-L7, E9 |
