'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App, ConfigProvider } from 'antd';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#6366f1',
            colorInfo: '#6366f1',
            borderRadius: 9,
            fontFamily:
              'var(--font-inter), Inter, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            colorText: '#111827',
            colorTextSecondary: '#6b7280',
            colorBorder: '#e5e7eb',
            colorBgContainer: '#ffffff',
          },
        }}
      >
        <App>{children}</App>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
