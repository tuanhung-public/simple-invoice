import { BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InvoicesService } from './invoices.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

describe('InvoicesService unique invoice number', () => {
  const prisma = {
    invoice: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
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

  it('rejects create when discount exceeds subtotal plus tax', async () => {
    (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      service.create('user-id', {
        ...dto,
        invoiceNumber: 'IV-NEG-TOTAL',
        discount: 1000,
        item: { name: 'Item', quantity: 1, rate: 100 },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

describe('InvoicesService findAll date filters', () => {
  const prisma = {
    invoice: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
  } as unknown as PrismaService;

  const service = new InvoicesService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects when fromDate is after toDate', async () => {
    await expect(
      service.findAll({
        fromDate: '2026-08-10',
        toDate: '2026-08-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('uses end-of-UTC-day for toDate', async () => {
    await service.findAll({ toDate: '2026-08-04' });

    expect(prisma.invoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          invoiceDate: {
            lte: new Date(Date.UTC(2026, 7, 4, 23, 59, 59, 999)),
          },
        }),
      }),
    );
  });
});
