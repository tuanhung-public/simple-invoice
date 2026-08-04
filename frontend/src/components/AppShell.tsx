'use client';

import { TOKEN_KEY, clearToken, getToken, resolveAuthRedirect } from '@/lib/auth';
import { fetchMe } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Spin } from 'antd';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [ready, setReady] = useState(false);
  const isLogin = pathname === '/login';

  useEffect(() => {
    const redirect = resolveAuthRedirect(pathname, Boolean(getToken()));
    if (redirect) {
      router.replace(redirect);
      return;
    }
    setReady(true);
  }, [isLogin, pathname, router]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== TOKEN_KEY) return;

      if (!event.newValue) {
        queryClient.removeQueries({ queryKey: ['me'] });
        if (!window.location.pathname.startsWith('/login')) {
          router.replace('/login');
        }
        return;
      }

      void queryClient.invalidateQueries({ queryKey: ['me'] });
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [queryClient, router]);

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
    enabled: ready && !isLogin,
    refetchOnWindowFocus: true,
  });

  if (!ready) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#f5f7fa',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (isLogin) {
    return <>{children}</>;
  }

  const displayName =
    meQuery.data?.fullname ?? meQuery.data?.email ?? '101 Digital Reviewer';
  const initialSource =
    meQuery.data?.fullname ?? meQuery.data?.email ?? displayName;
  const initial =
    (initialSource.match(/\p{L}/u)?.[0] ?? 'U').toUpperCase();
  const invoicesActive =
    pathname === '/invoices' ||
    (pathname.startsWith('/invoices/') && !pathname.startsWith('/invoices/new'));
  const createActive = pathname.startsWith('/invoices/new');

  return (
    <div className="si-shell">
      <header className="si-nav">
        <div className="si-frame si-nav-inner">
          <div className="si-nav-left">
            <Link href="/invoices" className="si-logo">
              <span className="si-logo-mark" aria-hidden>
                <span />
                <span />
                <span />
                <span />
              </span>
              SimpleInvoice
            </Link>
            <nav className="si-nav-links" aria-label="Primary">
              <Link
                href="/invoices"
                className={`si-nav-link${invoicesActive ? ' is-active' : ''}`}
              >
                Invoices
              </Link>
              <Link
                href="/invoices/new"
                className={`si-nav-link${createActive ? ' is-active' : ''}`}
              >
                Create
              </Link>
            </nav>
          </div>
          <div className="si-nav-right">
            <div className="si-user-chip">
              <span className="si-avatar" aria-hidden>
                {initial}
              </span>
              <span className="si-user-name" title={displayName}>
                {displayName}
              </span>
            </div>
            <button
              type="button"
              className="si-logout"
              onClick={() => {
                clearToken();
                router.replace('/login');
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="si-frame si-content">{children}</main>
    </div>
  );
}
