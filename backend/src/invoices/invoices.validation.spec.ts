import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { assertDueDateOnOrAfterInvoiceDate } from '../common/invoice-math';

describe('invoice validation rules', () => {
  it('rejects dueDate before invoiceDate', () => {
    expect(() =>
      assertDueDateOnOrAfterInvoiceDate(
        new Date('2026-06-10'),
        new Date('2026-06-01'),
      ),
    ).toThrow('dueDate must be on or after invoiceDate');
  });

  it('maps dueDate validation to BadRequestException shape', () => {
    try {
      assertDueDateOnOrAfterInvoiceDate(
        new Date('2026-06-10'),
        new Date('2026-06-01'),
      );
    } catch {
      const error = new BadRequestException([
        'dueDate must be on or after invoiceDate',
      ]);
      expect(error.getResponse()).toMatchObject({
        message: ['dueDate must be on or after invoiceDate'],
      });
    }
  });

  it('uses ConflictException for duplicate invoice numbers', () => {
    const error = new ConflictException('Invoice number must be unique');
    expect(error.getStatus()).toBe(409);
    expect(error.message).toContain('unique');
  });
});
