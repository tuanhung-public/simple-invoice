'use client';

/**
 * Token lives in localStorage, so the server cannot choose login vs invoices.
 * Avoid `redirect('/invoices')` here — guests would hit the list route first (flash).
 * AppShell + resolveAuthRedirect('/') send users to /login or /invoices.
 */
export default function HomePage() {
  return null;
}
