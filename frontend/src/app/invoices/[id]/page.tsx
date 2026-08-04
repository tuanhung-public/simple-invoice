'use client';

import { fetchInvoice, type InvoiceStatus } from '@/lib/api';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Alert, Spin } from 'antd';
import Link from 'next/link';
import { useParams } from 'next/navigation';

function statusBadgeClass(status: InvoiceStatus) {
  switch (status) {
    case 'Paid':
      return 'si-badge si-badge-paid';
    case 'Overdue':
      return 'si-badge si-badge-overdue';
    case 'Pending':
      return 'si-badge si-badge-pending';
    default:
      return 'si-badge si-badge-draft';
  }
}

function displayValue(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : 'N/A';
}

function money(symbol: string, value: number) {
  return `${symbol}${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function taxPercentLabel(subTotal: number, totalTax: number) {
  if (subTotal <= 0) return 'Tax';
  const pct = Math.round((totalTax / subTotal) * 100);
  return `Tax (${pct}%)`;
}

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const query = useQuery({
    queryKey: ['invoice', params.id],
    queryFn: () => fetchInvoice(params.id),
    enabled: Boolean(params.id),
  });

  if (query.isLoading) {
    return (
      <div className="si-detail-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="si-detail-page">
        <BackToList />
        <Alert type="error" showIcon title="Invoice not found" />
      </div>
    );
  }

  const invoice = query.data;
  const itemCount = invoice.items.length;

  return (
    <div className="si-detail-page">
      <BackToList />

      <header className="si-detail-header">
        <h1 className="si-detail-title">{invoice.invoiceNumber}</h1>
        <span className={statusBadgeClass(invoice.status)}>{invoice.status}</span>
      </header>

      <div className="si-detail-grid">
        <div className="si-panel-row si-panel-row-equal">
          <section className="si-detail-card">
            <h2 className="si-detail-card-title">Invoice information</h2>
            <dl className="si-detail-fields">
              <div className="si-detail-field">
                <dt>Reference</dt>
                <dd>{displayValue(invoice.invoiceReference)}</dd>
              </div>
              <div className="si-detail-field">
                <dt>Invoice date</dt>
                <dd>{invoice.invoiceDate}</dd>
              </div>
              <div className="si-detail-field">
                <dt>Due date</dt>
                <dd className="si-detail-accent">{invoice.dueDate}</dd>
              </div>
              <div className="si-detail-field">
                <dt>Currency</dt>
                <dd>{invoice.currency}</dd>
              </div>
              <div className="si-detail-field">
                <dt>Description</dt>
                <dd>{displayValue(invoice.description)}</dd>
              </div>
            </dl>
          </section>

          <section className="si-detail-card">
            <h2 className="si-detail-card-title">Customer</h2>
            <dl className="si-detail-fields">
              <div className="si-detail-field">
                <dt>Name</dt>
                <dd>{invoice.customer.fullname}</dd>
              </div>
              <div className="si-detail-field">
                <dt>Email</dt>
                <dd>
                  <a className="si-detail-accent" href={`mailto:${invoice.customer.email}`}>
                    {invoice.customer.email}
                  </a>
                </dd>
              </div>
              <div className="si-detail-field">
                <dt>Mobile</dt>
                <dd>{displayValue(invoice.customer.mobileNumber)}</dd>
              </div>
              <div className="si-detail-field">
                <dt>Address</dt>
                <dd>{displayValue(invoice.customer.address)}</dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="si-panel-row si-panel-row-split">
          <section className="si-detail-card si-detail-lines">
            <div className="si-detail-lines-head">
              <h2 className="si-detail-card-title">Line items</h2>
              <span className="si-detail-count" aria-label={`${itemCount} line items`}>
                {itemCount}
              </span>
            </div>

            <div className="si-detail-table-wrap">
              <table className="si-detail-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="is-num">Qty</th>
                    <th className="is-num">Rate</th>
                    <th className="is-num">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td className="is-num">
                        <span className="si-detail-qty">{item.quantity}</span>
                      </td>
                      <td className="is-num">
                        {money(invoice.currencySymbol, item.rate)}
                      </td>
                      <td className="is-num is-amount">
                        {money(invoice.currencySymbol, item.quantity * item.rate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="si-detail-card si-detail-amounts">
            <h2 className="si-detail-card-title">Amounts</h2>
            <div className="si-detail-summary">
              <SummaryRow
                label="Subtotal"
                value={money(invoice.currencySymbol, invoice.invoiceSubTotal)}
              />
              <SummaryRow
                label={taxPercentLabel(invoice.invoiceSubTotal, invoice.totalTax)}
                value={money(invoice.currencySymbol, invoice.totalTax)}
              />
              <SummaryRow
                label="Discount"
                value={`−${money(invoice.currencySymbol, invoice.totalDiscount)}`}
              />
              <SummaryRow
                label="Total"
                value={money(invoice.currencySymbol, invoice.totalAmount)}
                variant="total"
              />
              <SummaryRow
                label="Outstanding"
                value={money(invoice.currencySymbol, invoice.balanceAmount)}
                variant="outstanding"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function BackToList() {
  return (
    <Link href="/invoices" className="si-detail-back">
      <ArrowLeftOutlined aria-hidden />
      Invoices
    </Link>
  );
}

function SummaryRow({
  label,
  value,
  variant = 'default',
}: {
  label: string;
  value: string;
  variant?: 'default' | 'total' | 'outstanding';
}) {
  return (
    <div className={`si-detail-summary-row is-${variant}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
