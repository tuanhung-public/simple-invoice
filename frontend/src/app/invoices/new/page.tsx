'use client';

import { createInvoice } from '@/lib/api';
import { buildRandomCreateInvoiceInitialValues } from '@/lib/create-invoice-defaults';
import { buildCreateInvoicePayload } from '@/lib/create-invoice-payload';
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';
import {
  App,
  Alert,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

type CreateForm = {
  customerName: string;
  customerEmail: string;
  customerMobile?: string;
  customerAddress?: string;
  invoiceNumber: string;
  invoiceReference?: string;
  invoiceDate: Dayjs;
  dueDate: Dayjs;
  currency: string;
  description?: string;
  itemName: string;
  itemQuantity: number;
  itemRate: number;
  taxPercent?: number;
  discount?: number;
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  AUD: 'AU$',
  USD: '$',
  GBP: '£',
  EUR: '€',
  SGD: 'S$',
};

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function money(symbol: string, value: number) {
  return `${symbol}${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<CreateForm>();
  const [initialValues] = useState(() => {
    const random = buildRandomCreateInvoiceInitialValues();
    return {
      ...random,
      invoiceDate: dayjs(random.invoiceDate),
      dueDate: dayjs(random.dueDate),
    };
  });

  const currency = Form.useWatch('currency', form) ?? initialValues.currency;
  const itemQuantity = Form.useWatch('itemQuantity', form) ?? 0;
  const itemRate = Form.useWatch('itemRate', form) ?? 0;
  const taxPercent = Form.useWatch('taxPercent', form);
  const discount = Form.useWatch('discount', form);
  const dueDate = Form.useWatch('dueDate', form);

  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
  const totals = useMemo(() => {
    const qty = Number(itemQuantity) || 0;
    const rate = Number(itemRate) || 0;
    // Align with server defaults: tax 10%, discount 0 when unset.
    const taxPct =
      taxPercent == null || Number.isNaN(Number(taxPercent))
        ? 10
        : Number(taxPercent);
    const disc =
      discount == null || Number.isNaN(Number(discount)) ? 0 : Number(discount);
    const subTotal = roundMoney(qty * rate);
    const taxAmount = roundMoney(subTotal * (taxPct / 100));
    const discountAmount = roundMoney(disc);
    const totalAmount = roundMoney(subTotal + taxAmount - discountAmount);
    return { subTotal, taxAmount, discountAmount, totalAmount, taxPct };
  }, [itemQuantity, itemRate, taxPercent, discount]);

  const dueDateInPast = Boolean(
    dueDate && dayjs.isDayjs(dueDate) && dueDate.isBefore(dayjs(), 'day'),
  );
  const discountTooHigh = totals.totalAmount < 0;

  const onFinish = async (values: CreateForm) => {
    if (discountTooHigh) {
      message.error('Discount cannot exceed subtotal plus tax');
      return;
    }

    setLoading(true);
    try {
      await createInvoice(
        buildCreateInvoicePayload({
          ...values,
          customerName: values.customerName.trim(),
          customerEmail: values.customerEmail.trim(),
          customerMobile: values.customerMobile?.trim() || undefined,
          customerAddress: values.customerAddress?.trim() || undefined,
          invoiceNumber: values.invoiceNumber.trim(),
          invoiceReference: values.invoiceReference?.trim() || undefined,
          description: values.description?.trim() || undefined,
          itemName: values.itemName.trim(),
          invoiceDate: values.invoiceDate.format('YYYY-MM-DD'),
          dueDate: values.dueDate.format('YYYY-MM-DD'),
        }),
      );
      message.success('Invoice created successfully');
      router.push('/invoices');
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string | string[] } } })
        ?.response?.data?.message;
      const text = Array.isArray(data) ? data.join(', ') : data || 'Failed to create invoice';
      message.error(text);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="si-create-page">
      <Link href="/invoices" className="si-detail-back">
        <ArrowLeftOutlined aria-hidden />
        Invoices
      </Link>

      <header className="si-create-header">
        <h1 className="si-create-title">Create Invoice</h1>
      </header>

      <Form
        form={form}
        layout="vertical"
        className="si-create-form"
        onFinish={onFinish}
        initialValues={initialValues}
        requiredMark
      >
        <div className="si-create-grid">
          <div className="si-panel-row si-panel-row-equal">
            <section className="si-create-card">
              <h2 className="si-create-card-title">Invoice information</h2>
              <div className="si-create-row si-create-row-2">
                <Form.Item
                  label="Invoice number"
                  name="invoiceNumber"
                  rules={[
                    {
                      required: true,
                      whitespace: true,
                      message: 'Invoice number is required',
                    },
                  ]}
                >
                  <Input placeholder="IV-XXXX" />
                </Form.Item>
                <Form.Item label="Reference" name="invoiceReference">
                  <Input />
                </Form.Item>
              </div>
              <div className="si-create-row si-create-row-dates">
                <Form.Item
                  label="Invoice date"
                  name="invoiceDate"
                  rules={[{ required: true, message: 'Invoice date is required' }]}
                >
                  <DatePicker style={{ width: '100%' }} format="MM/DD/YYYY" />
                </Form.Item>
                <Form.Item
                  label="Due date"
                  name="dueDate"
                  dependencies={['invoiceDate']}
                  rules={[
                    { required: true, message: 'Due date is required' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        const invoiceDate = getFieldValue('invoiceDate');
                        if (
                          !value ||
                          !invoiceDate ||
                          !value.isBefore(invoiceDate, 'day')
                        ) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error('Due date must be on or after invoice date'),
                        );
                      },
                    }),
                  ]}
                >
                  <DatePicker style={{ width: '100%' }} format="MM/DD/YYYY" />
                </Form.Item>
                <Form.Item
                  label="Currency"
                  name="currency"
                  rules={[{ required: true, message: 'Currency is required' }]}
                >
                  <Select
                    options={['AUD', 'USD', 'GBP', 'EUR', 'SGD'].map((v) => ({
                      value: v,
                      label: v,
                    }))}
                  />
                </Form.Item>
              </div>
              <Form.Item
                label="Description"
                name="description"
                className="si-create-item-flush"
              >
                <Input.TextArea rows={2} />
              </Form.Item>
            </section>

            <section className="si-create-card">
              <h2 className="si-create-card-title">Customer</h2>
              <div className="si-create-row si-create-row-2">
                <Form.Item
                  label="Name"
                  name="customerName"
                  rules={[
                    {
                      required: true,
                      whitespace: true,
                      message: 'Name is required',
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label="Email"
                  name="customerEmail"
                  rules={[
                    {
                      required: true,
                      whitespace: true,
                      message: 'Email is required',
                    },
                    { type: 'email', message: 'Enter a valid email' },
                  ]}
                >
                  <Input />
                </Form.Item>
              </div>
              <Form.Item label="Mobile" name="customerMobile">
                <Input />
              </Form.Item>
              <Form.Item
                label="Address"
                name="customerAddress"
                className="si-create-item-flush"
              >
                <Input.TextArea rows={2} />
              </Form.Item>
            </section>
          </div>

          <div className="si-panel-row si-panel-row-split">
            <section className="si-create-card">
              <h2 className="si-create-card-title">Line item</h2>
              <div className="si-create-row si-create-row-line">
                <Form.Item
                  label="Item name"
                  name="itemName"
                  rules={[
                    {
                      required: true,
                      whitespace: true,
                      message: 'Item name is required',
                    },
                  ]}
                  className="si-create-item-flush"
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label="Quantity"
                  name="itemQuantity"
                  rules={[{ required: true, message: 'Quantity is required' }]}
                  className="si-create-item-flush"
                >
                  <InputNumber min={1} precision={0} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item
                  label="Rate"
                  name="itemRate"
                  rules={[{ required: true, message: 'Rate is required' }]}
                  className="si-create-item-flush"
                >
                  <InputNumber min={0.01} style={{ width: '100%' }} />
                </Form.Item>
              </div>
            </section>

            <section className="si-create-card">
              <h2 className="si-create-card-title">Amounts</h2>
              <div className="si-create-row si-create-row-2">
                <Form.Item
                  label="Tax (%)"
                  name="taxPercent"
                  rules={[
                    {
                      type: 'number',
                      min: 0,
                      max: 1000,
                      message: 'Tax must be between 0% and 1000%',
                    },
                  ]}
                >
                  <InputNumber min={0} max={1000} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item
                  label="Discount"
                  name="discount"
                  validateStatus={discountTooHigh ? 'error' : undefined}
                  help={
                    discountTooHigh
                      ? 'Discount cannot exceed subtotal plus tax'
                      : undefined
                  }
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </div>
              <p className="si-create-preview-note">
                Preview — final totals from server
              </p>
              <div className="si-create-summary">
                <div className="si-create-summary-row">
                  <span>Subtotal</span>
                  <span>{money(symbol, totals.subTotal)}</span>
                </div>
                <div className="si-create-summary-row">
                  <span>Tax ({totals.taxPct}%)</span>
                  <span>{money(symbol, totals.taxAmount)}</span>
                </div>
                <div className="si-create-summary-row">
                  <span>Discount</span>
                  <span>−{money(symbol, totals.discountAmount)}</span>
                </div>
                <div className="si-create-summary-row is-total">
                  <span>Total</span>
                  <span>{money(symbol, totals.totalAmount)}</span>
                </div>
              </div>
            </section>
          </div>
        </div>

        {dueDateInPast ? (
          <Alert
            type="warning"
            showIcon
            className="si-create-alert"
            title="Past due date — this draft will appear as Overdue right away"
          />
        ) : null}

        <div className="si-create-actions">
          <button
            type="button"
            className="si-create-btn-cancel"
            onClick={() => router.push('/invoices')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="si-btn-primary si-create-btn-submit"
            disabled={loading || discountTooHigh}
          >
            <PlusOutlined aria-hidden />
            {loading ? 'Creating…' : 'Create Invoice'}
          </button>
        </div>
      </Form>
    </div>
  );
}
