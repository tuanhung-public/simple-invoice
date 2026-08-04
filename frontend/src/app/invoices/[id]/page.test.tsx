import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App, ConfigProvider } from 'antd';
import InvoiceDetailPage from '@/app/invoices/[id]/page';
import { fetchInvoice } from '@/lib/api';
import type { Invoice } from '@/lib/api';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'inv-1' }),
}));

vi.mock('@/lib/api', () => ({
  fetchInvoice: vi.fn(),
}));

const baseInvoice: Invoice = {
  invoiceId: 'inv-1',
  invoiceNumber: 'IV-DETAIL-1',
  invoiceReference: '#REF-1',
  invoiceDate: '2026-08-01',
  dueDate: '2026-08-31',
  currency: 'AUD',
  currencySymbol: 'AU$',
  description: 'Detail fixture',
  status: 'Draft',
  invoiceSubTotal: 200,
  totalTax: 20,
  totalDiscount: 0,
  totalAmount: 220,
  totalPaid: 0,
  balanceAmount: 220,
  createdAt: '2026-08-01T00:00:00.000Z',
  createdBy: 'user-1',
  customer: {
    fullname: 'Bob Customer',
    email: 'bob@example.com',
    mobileNumber: '123',
    address: 'Singapore',
  },
  items: [
    {
      id: 'item-1',
      name: 'Service A',
      quantity: 2,
      rate: 100,
    },
  ],
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderDetail() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ConfigProvider>
        <App>
          <InvoiceDetailPage />
        </App>
      </ConfigProvider>
    </QueryClientProvider>,
  );
}

describe('InvoiceDetailPage', () => {
  it('renders happy-path detail fields from the API', async () => {
    vi.mocked(fetchInvoice).mockResolvedValue(baseInvoice);

    renderDetail();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'IV-DETAIL-1' })).toBeInTheDocument();
    });

    expect(screen.getByText('Bob Customer')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    expect(screen.getByText('Service A')).toBeInTheDocument();
    expect(screen.getAllByText('AU$220.00').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(fetchInvoice).toHaveBeenCalledWith('inv-1');
  });

  it('shows not-found alert when the API fails', async () => {
    vi.mocked(fetchInvoice).mockRejectedValue(new Error('Not found'));

    renderDetail();

    await waitFor(() => {
      expect(screen.getByText(/invoice not found/i)).toBeInTheDocument();
    });
    expect(screen.queryByRole('heading', { name: 'IV-DETAIL-1' })).not.toBeInTheDocument();
  });

  it('renders the Overdue status badge', async () => {
    vi.mocked(fetchInvoice).mockResolvedValue({
      ...baseInvoice,
      status: 'Overdue',
      dueDate: '2026-01-01',
    });

    renderDetail();

    await waitFor(() => {
      expect(screen.getByText('Overdue')).toBeInTheDocument();
    });

    const badge = screen.getByText('Overdue');
    expect(badge.className).toContain('si-badge-overdue');
  });
});
