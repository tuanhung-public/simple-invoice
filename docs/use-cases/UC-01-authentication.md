# UC-01 — Authentication

## Goal

A Guest signs in with email and password, receives an access token kept on the client, and reaches the invoice list; Guests cannot use protected screens or invoice APIs.

## Actors

- **Guest** — starts on the login screen.
- **User** — after successful login (includes the seeded **Reviewer** account).

## Preconditions

- The system has at least one seeded user (Reviewer) with known credentials.
- The Guest is not authenticated (no usable access token on the client).

## Main success scenario

1. Guest opens the application and lands on (or is sent to) the **Login** screen.
2. Guest enters **email** and **password**.
3. Client validates that both fields are present and that email looks like an email address.
4. Guest submits the form.
5. System validates the credentials server-side and, on success, issues a **JWT access token**.
6. Client stores the token for later API calls.
7. System navigates the User to the **Invoice List** (default home after login).
8. Subsequent calls to protected invoice APIs include the token; `GET /auth/me`-style profile access works while the token is valid.

## Extensions

### E1 — Empty or invalid client input

- **When:** Guest submits with empty email/password, or a non-email string in the email field.
- **Then:** Client shows validation messages and does **not** call the server (or the call is not required to succeed).
- **Done when:** User remains on Login; no token is stored.

### E2 — Wrong credentials

- **When:** Email/password do not match a user.
- **Then:** System rejects login with a clear error; no token is stored; Guest stays on Login.

### E3 — Guest hits a protected screen

- **When:** Guest opens Invoice List, Detail, or Create (or any non-login app route) without a token.
- **Then:** System redirects to Login automatically.

### E4 — Already authenticated Guest opens Login

- **When:** A valid token already exists and the user opens Login.
- **Then:** System sends them to Invoice List (no need to log in again).

### E5 — Expired or rejected token on a protected API

- **When:** A request to a protected resource fails because the token is missing, invalid, or expired.
- **Then:** Client clears the stored token (if any) and returns the user to Login; invoice APIs remain inaccessible without a new login.

### E6 — Logout

- **When:** Authenticated User chooses Logout.
- **Then:** Client clears the token and returns to Login; protected routes again behave as for a Guest.

### E7 — Token change in another browser tab

- **When:** Token is cleared or replaced in another tab (same browser profile).
- **Then:** This tab reacts: cleared token → treat as Guest (Login); new token → refresh profile / stay consistent with the new session.

## Business rules

| ID     | Rule |
| ------ | ---- |
| BR-A1  | Login requires email + password only. Advanced password policy, expiration, and MFA are **out of scope**. |
| BR-A2  | Access to invoice list/detail/create (UI and APIs) requires a valid access token. |
| BR-A3  | After successful login, the landing screen is **Invoice List**. |
| BR-A4  | Token lifetime is configurable; default **3600 seconds** if unset. |
| BR-A5  | At least one Reviewer user must exist for assessors (credentials documented for reviewers). |
| BR-A6  | Failed login must not reveal whether the email exists (same generic failure message is preferred). |

Cross-cutting money/status rules are not part of this use case; see [business-rules.md](./business-rules.md) when that file exists.

## Acceptance checks

- [ ] Login screen shows email and password fields.
- [ ] Client-side validation runs for empty fields and invalid email format.
- [ ] Server-side validation rejects invalid login payloads (e.g. missing/invalid email, empty password).
- [ ] Successful login returns a JWT; client stores it and uses it on later requests.
- [ ] Successful login lands on Invoice List.
- [ ] Unauthenticated access to protected UI routes redirects to Login.
- [ ] Unauthenticated calls to invoice APIs are rejected (401).
- [ ] Invalid credentials show an error and do not store a token.
- [ ] Logout clears the token and returns to Login.
- [ ] Token expiry is driven by configuration (default 3600s).
- [ ] Seeded Reviewer can log in with documented credentials.
- [ ] (Value-add) Multi-tab token clear/replace is handled without leaving a stale “logged-in” shell.

## Out of scope

- Registration / forgot-password flows.
- Refresh tokens, remember-me, SSO.
- MFA, password complexity, forced rotation.
- Server-rendered auth session cookies (assessment allows client-stored JWT).

## Traceability (assessment)

| Assessment item | Covered by |
| --------------- | ---------- |
| Login screen email + password | Main scenario steps 1–2 |
| Client + server validation | Steps 3–5, E1, acceptance |
| Issue JWT + store client-side | Steps 5–6 |
| Protect routes; redirect Guests | E3, E5, BR-A2 |
| No advanced password policies | BR-A1, Out of scope |
| Home = Invoice List after login | Step 7, BR-A3 |
| JWT on `/invoices`, configurable expiry, seeded user | BR-A2, BR-A4, BR-A5 |
