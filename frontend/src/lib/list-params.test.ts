import { describe, expect, it } from 'vitest';
import { buildInvoiceListParams } from './list-params';

describe('buildInvoiceListParams', () => {
  it('includes pagination and sorting defaults', () => {
    expect(buildInvoiceListParams({})).toEqual({
      page: 1,
      pageSize: 10,
      sortBy: 'invoiceDate',
      ordering: 'DESC',
    });
  });

  it('includes optional filters when provided', () => {
    expect(
      buildInvoiceListParams({
        status: 'Overdue',
        keyword: ' paul ',
        fromDate: '2026-01-01',
        toDate: '2026-12-31',
      }),
    ).toMatchObject({
      status: 'Overdue',
      keyword: 'paul',
      fromDate: '2026-01-01',
      toDate: '2026-12-31',
    });
  });
});
