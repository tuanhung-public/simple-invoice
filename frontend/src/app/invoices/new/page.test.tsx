import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App, ConfigProvider } from 'antd';
import CreateInvoicePage from '@/app/invoices/new/page';

const push = vi.fn();
const createInvoice = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

vi.mock('@/lib/api', () => ({
  createInvoice: (...args: unknown[]) => createInvoice(...args),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderCreate() {
  return render(
    <ConfigProvider>
      <App>
        <CreateInvoicePage />
      </App>
    </ConfigProvider>,
  );
}

describe('CreateInvoicePage', () => {
  it('renders required create fields', () => {
    renderCreate();
    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/invoice number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^item name$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create invoice/i })).toBeInTheDocument();
  });

  it('shows validation when required fields are cleared', async () => {
    renderCreate();
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/invoice number/i), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/^item name$/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /create invoice/i }));
    await waitFor(() => {
      expect(screen.getByText(/^name is required$/i)).toBeInTheDocument();
    });
    expect(createInvoice).not.toHaveBeenCalled();
  });

  it('pre-fills random demo data on load', () => {
    renderCreate();
    expect(screen.getByLabelText(/^name$/i)).not.toHaveValue('');
    expect((screen.getByLabelText(/invoice number/i) as HTMLInputElement).value).toMatch(
      /^IV-/,
    );
  });
});

