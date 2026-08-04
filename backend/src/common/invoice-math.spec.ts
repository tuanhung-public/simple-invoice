import { calculateInvoiceTotals, deriveInvoiceStatus } from './invoice-math';

describe('invoice-math', () => {
  describe('calculateInvoiceTotals', () => {
    it('calculates subtotal, tax, total and balance', () => {
      const result = calculateInvoiceTotals({
        quantity: 2,
        rate: 1000,
        taxPercent: 10,
        discount: 20,
        totalPaid: 1451.34,
      });

      expect(result).toEqual({
        invoiceSubTotal: 2000,
        totalTax: 200,
        totalDiscount: 20,
        totalAmount: 2180,
        totalPaid: 1451.34,
        balanceAmount: 728.66,
      });
    });

    it('defaults totalPaid to 0', () => {
      const result = calculateInvoiceTotals({
        quantity: 1,
        rate: 100,
        taxPercent: 10,
        discount: 0,
      });

      expect(result.totalAmount).toBe(110);
      expect(result.balanceAmount).toBe(110);
      expect(result.totalPaid).toBe(0);
    });
  });

  describe('deriveInvoiceStatus', () => {
    const today = new Date('2026-08-03T00:00:00.000Z');

    it('returns Overdue when unpaid and dueDate is in the past', () => {
      expect(
        deriveInvoiceStatus('Pending', new Date('2026-07-01'), today),
      ).toBe('Overdue');
    });

    it('does not mark Paid invoices as Overdue', () => {
      expect(deriveInvoiceStatus('Paid', new Date('2026-07-01'), today)).toBe(
        'Paid',
      );
    });

    it('returns persisted status when not overdue', () => {
      expect(deriveInvoiceStatus('Draft', new Date('2026-09-01'), today)).toBe(
        'Draft',
      );
    });
  });
});
