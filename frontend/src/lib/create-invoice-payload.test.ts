import { describe, expect, it } from 'vitest';
import { buildCreateInvoicePayload } from './create-invoice-payload';

describe('buildCreateInvoicePayload', () => {
  it('maps form values to API body and applies tax/discount defaults', () => {
    expect(
      buildCreateInvoicePayload({
        customerName: 'Paul',
        customerEmail: 'paul@101digital.io',
        invoiceNumber: 'IV-1',
        invoiceDate: '2026-08-01',
        dueDate: '2026-08-31',
        currency: 'AUD',
        itemName: 'Item',
        itemQuantity: 2,
        itemRate: 100,
      }),
    ).toEqual({
      customerName: 'Paul',
      customerEmail: 'paul@101digital.io',
      customerMobile: undefined,
      customerAddress: undefined,
      invoiceNumber: 'IV-1',
      invoiceReference: undefined,
      invoiceDate: '2026-08-01',
      dueDate: '2026-08-31',
      currency: 'AUD',
      description: undefined,
      taxPercent: 10,
      discount: 0,
      item: {
        name: 'Item',
        quantity: 2,
        rate: 100,
      },
    });
  });
});
