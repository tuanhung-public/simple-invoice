import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InvoicesService } from './invoices.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

describe('InvoicesService unique invoice number', () => {
  const prisma = {
    invoice: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  } as unknown as PrismaService;

  const service = new InvoicesService(prisma);

  const dto: CreateInvoiceDto = {
    customerName: 'Paul',
    customerEmail: 'paul@example.com',
    invoiceNumber: 'IV-DUPLICATE',
    invoiceDate: '2026-08-01',
    dueDate: '2026-08-31',
    currency: 'AUD',
    item: { name: 'Item', quantity: 1, rate: 100 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects create when invoiceNumber already exists', async () => {
    (prisma.invoice.findUnique as jest.Mock).mockResolvedValue({
      id: 'existing-id',
      invoiceNumber: 'IV-DUPLICATE',
    });

    await expect(service.create('user-id', dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    await expect(service.create('user-id', dto)).rejects.toThrow(
      'Invoice number must be unique',
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('maps Prisma unique constraint race (P2002) to ConflictException', async () => {
    (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(null);
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      { code: 'P2002', clientVersion: 'test', meta: { target: ['invoiceNumber'] } },
    );
    (prisma.$transaction as jest.Mock).mockRejectedValue(prismaError);

    await expect(service.create('user-id', dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    await expect(service.create('user-id', dto)).rejects.toThrow(
      'Invoice number must be unique',
    );
  });
});
