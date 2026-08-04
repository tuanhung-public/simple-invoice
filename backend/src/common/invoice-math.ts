export type PersistedInvoiceStatus = 'Draft' | 'Pending' | 'Paid';
export type DisplayInvoiceStatus = PersistedInvoiceStatus | 'Overdue';

export function calculateInvoiceTotals(input: {
  quantity: number;
  rate: number;
  taxPercent: number;
  discount: number;
  totalPaid?: number;
}) {
  const subTotal = roundMoney(input.quantity * input.rate);
  const taxAmount = roundMoney(subTotal * (input.taxPercent / 100));
  const discount = roundMoney(input.discount);
  const totalAmount = roundMoney(subTotal + taxAmount - discount);
  const totalPaid = roundMoney(input.totalPaid ?? 0);
  const balanceAmount = roundMoney(totalAmount - totalPaid);

  return {
    invoiceSubTotal: subTotal,
    totalTax: taxAmount,
    totalDiscount: discount,
    totalAmount,
    totalPaid,
    balanceAmount,
  };
}

export function deriveInvoiceStatus(
  status: PersistedInvoiceStatus,
  dueDate: Date,
  today: Date = startOfUtcDay(new Date()),
): DisplayInvoiceStatus {
  if (status !== 'Paid' && startOfUtcDay(dueDate) < today) {
    return 'Overdue';
  }
  return status;
}

export function assertDueDateOnOrAfterInvoiceDate(
  invoiceDate: Date,
  dueDate: Date,
): void {
  if (startOfUtcDay(dueDate) < startOfUtcDay(invoiceDate)) {
    throw new Error('dueDate must be on or after invoiceDate');
  }
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function endOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  AUD: 'AU$',
  USD: '$',
  GBP: '£',
  EUR: '€',
  SGD: 'S$',
  VND: '₫',
};
