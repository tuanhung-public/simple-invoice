# 04 — Auth and session

How authentication and client session work: JWT issuance, storage, request attachment, route protection, and expiry.

Product flow: [../use-cases/UC-01-authentication.md](../use-cases/UC-01-authentication.md).  
HTTP shapes: [03-api-contract.md](./03-api-contract.md).

---

## Model

SimpleInvoice uses **stateless JWT access tokens** (assessment requirement). There is no server-side session store and no refresh-token flow.

```text
Login (email + password)
    → API verifies user (bcrypt) and signs JWT
    → Client stores accessToken in localStorage
    → Later requests send Authorization: Bearer <token>
    → API validates signature + expiry (Passport JWT)
```

Passwords are stored as **bcrypt hashes** on `User.passwordHash`. The API never returns the hash.

---

## Backend

### Endpoints

| Method | Path | Auth | Role |
| ------ | ---- | ---- | ---- |
| `POST` | `/auth/login` | Public | Issue JWT + basic user profile |
| `GET` | `/auth/me` | Bearer | Current user profile |
| `*` | `/invoices…` | Bearer | All invoice routes use `JwtAuthGuard` |

### Login

1. Validate body (`email`, `password` min length 6).
2. Load user by lowercased email; compare password with bcrypt.
3. On failure, respond `401` with the same message for unknown user and bad password: `Invalid email or password`.
4. On success, sign JWT with payload `{ sub: userId, email }` and return `{ accessToken, user }`.

### JWT configuration

| Setting | Source | Default |
| ------- | ------ | ------- |
| Signing / verify secret | `JWT_SECRET` (required) | — |
| Access token lifetime | `JWT_EXPIRES_IN` (seconds) | **3600** |

Configured in `AuthModule` via `@nestjs/jwt`. Strategy extracts the token from the **Authorization Bearer** header (`ExtractJwt.fromAuthHeaderAsBearerToken()`), verifies signature, and rejects expired tokens (`ignoreExpiration: false`).

`JwtStrategy.validate` maps the payload to `{ userId, email }` for `@CurrentUser()` on controllers.

### Guarding invoices

`InvoicesController` is annotated with `@UseGuards(JwtAuthGuard)` and `@ApiBearerAuth()`. Missing or invalid tokens yield **401**.

---

## Frontend session

### Storage

| Item | Detail |
| ---- | ------ |
| Key | `simple_invoice_token` |
| Place | `localStorage` (assessment: store JWT on the client) |
| Set | After successful login (`setToken`) |
| Clear | Logout, or axios **401** interceptor |

The token is **not** placed in request bodies. Axios attaches it on every API call:

```http
Authorization: Bearer <accessToken>
```

### Route gate (`AppShell`)

On each navigation:

| Condition | Action |
| --------- | ------ |
| No token, path ≠ `/login` | Redirect to `/login` |
| Token present, path = `/login` | Redirect to `/invoices` |
| Otherwise | Render the page |

Helpers live in `frontend/src/lib/auth.ts` (`getToken` / `setToken` / `clearToken` / `resolveAuthRedirect`).

### Profile

When authenticated, the shell loads `GET /auth/me` (React Query) for the header display name. It refetches on window focus.

### Logout

Clears `localStorage` and navigates to `/login`. No server revoke endpoint (stateless JWT); the token remains cryptographically valid until expiry but the client stops sending it.

### Multi-tab behaviour

A `storage` listener on `simple_invoice_token`:

- Token removed in another tab → clear profile cache and send this tab to `/login`.
- Token replaced in another tab → invalidate `/auth/me` so the header matches the new session.

---

## Expiry and 401 handling

The UI treats “logged in” as **presence of a token string**, not by decoding `exp` up front.

When a protected API returns **401** (expired, bad signature, or missing user):

1. Axios response interceptor clears the token.
2. Browser navigates to `/login` (unless already there).

So expiry is enforced on the **server** at request time; the client reacts when the API rejects the token.

---

## Seeded reviewer account

| Field | Value |
| ----- | ----- |
| Email | `reviewer@101digital.io` |
| Password | `Password123!` |

Created by `backend` seed (`npm run seed` / Compose startup). Documented in the root and backend README for assessors.

---

## Out of scope (by design)

Aligned with the assessment note on authentication:

- MFA, password complexity policies, forced rotation  
- Refresh tokens / sliding sessions  
- HttpOnly cookie session (client-stored JWT is intentional)  
- Server-side token blacklist on logout  

---

## Related reading

- [03-api-contract.md](./03-api-contract.md) — login / me request and response bodies  
- [01-architecture-and-stack.md](./01-architecture-and-stack.md) — module placement  
- [02-data-model.md](./02-data-model.md) — `User` entity  
