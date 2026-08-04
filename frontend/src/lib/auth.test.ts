import { describe, expect, it, beforeEach } from 'vitest';
import {
  TOKEN_KEY,
  clearToken,
  getToken,
  resolveAuthRedirect,
  setToken,
} from './auth';

describe('auth token storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores and reads the JWT', () => {
    setToken('abc.def.ghi');
    expect(getToken()).toBe('abc.def.ghi');
    expect(localStorage.getItem(TOKEN_KEY)).toBe('abc.def.ghi');
  });

  it('clears the JWT on logout', () => {
    setToken('abc.def.ghi');
    clearToken();
    expect(getToken()).toBeNull();
  });
});

describe('resolveAuthRedirect', () => {
  it('sends unauthenticated users to login from protected routes', () => {
    expect(resolveAuthRedirect('/invoices', false)).toBe('/login');
    expect(resolveAuthRedirect('/invoices/new', false)).toBe('/login');
  });

  it('keeps unauthenticated users on the login page', () => {
    expect(resolveAuthRedirect('/login', false)).toBeNull();
  });

  it('sends authenticated users away from login to the invoice list', () => {
    expect(resolveAuthRedirect('/login', true)).toBe('/invoices');
  });

  it('does not redirect authenticated users already on app pages', () => {
    expect(resolveAuthRedirect('/invoices', true)).toBeNull();
  });
});
