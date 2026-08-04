export const TOKEN_KEY = 'simple_invoice_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Decide where the client should navigate based on auth state.
 * Used by AppShell and covered by unit tests.
 */
export function resolveAuthRedirect(
  pathname: string,
  hasToken: boolean,
): '/login' | '/invoices' | null {
  const isLogin = pathname === '/login';
  if (!hasToken && !isLogin) return '/login';
  if (hasToken && isLogin) return '/invoices';
  return null;
}
