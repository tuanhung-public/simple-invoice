import { describe, expect, it } from 'vitest';
import { buildRandomCreateInvoiceInitialValues } from '@/lib/create-invoice-defaults';

describe('buildRandomCreateInvoiceInitialValues', () => {
  it('fills required create fields with valid shapes', () => {
    const values = buildRandomCreateInvoiceInitialValues();

    expect(values.customerName.length).toBeGreaterThan(0);
    expect(values.customerEmail).toMatch(/@example\.com$/);
    expect(values.invoiceNumber).toMatch(/^IV-[A-Z0-9]+$/);
    expect(values.itemName.length).toBeGreaterThan(0);
    expect(values.itemQuantity).toBeGreaterThanOrEqual(1);
    expect(values.itemRate).toBeGreaterThan(0);
    expect(values.invoiceDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(values.dueDate >= values.invoiceDate).toBe(true);
  });
});
