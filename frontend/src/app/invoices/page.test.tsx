import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App, ConfigProvider } from 'antd';
import InvoicesPage from '@/app/invoices/page';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock('@/lib/api', () => ({
  fetchInvoices: vi.fn().mockResolvedValue({
    data: [
      {
        invoiceId: 'inv-1',
        invoiceNumber: 'IV-1001',
        invoiceDate: '2026-08-01',
        dueDate: '2026-08-31',
        currency: 'AUD',
        currencySymbol: 'AU$',
        status: 'Draft',
        invoiceSubTotal: 100,
        totalTax: 10,
        totalDiscount: 0,
        totalAmount: 110,
        totalPaid: 0,
        balanceAmount: 110,
        createdAt: '2026-08-01T00:00:00.000Z',
        createdBy: 'user-1',
        customer: {
          fullname: 'Alice',
          email: 'alice@example.com',
        },
        items: [],
      },
    ],
    paging: { page: 1, pageSize: 10, total: 1 },
  }),
}));

afterEach(() => {
  cleanup();
});

function renderList() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ConfigProvider>
        <App>
          <InvoicesPage />
        </App>
      </ConfigProvider>
    </QueryClientProvider>,
  );
}

describe('InvoicesPage', () => {
  it('renders list chrome and invoice rows from the API', async () => {
    renderList();

    expect(screen.getByTestId('invoices-page')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/search invoice # or customer/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create invoice/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('IV-1001')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
  });
});
