import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CURRENCY_SYMBOLS,
  assertDueDateOnOrAfterInvoiceDate,
  calculateInvoiceTotals,
  deriveInvoiceStatus,
  startOfUtcDay,
} from '../common/invoice-math';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { ListInvoicesQueryDto } from './dto/list-invoices-query.dto';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateInvoiceDto) {
    const invoiceDate = new Date(dto.invoiceDate);
    const dueDate = new Date(dto.dueDate);

    try {
      assertDueDateOnOrAfterInvoiceDate(invoiceDate, dueDate);
    } catch {
      throw new BadRequestException([
        'dueDate must be on or after invoiceDate',
      ]);
    }

    const existing = await this.prisma.invoice.findUnique({
      where: { invoiceNumber: dto.invoiceNumber },
    });
    if (existing) {
      throw new ConflictException('Invoice number must be unique');
    }

    const taxPercent = dto.taxPercent ?? 10;
    const discount = dto.discount ?? 0;
    const totals = calculateInvoiceTotals({
      quantity: dto.item.quantity,
      rate: dto.item.rate,
      taxPercent,
      discount,
      totalPaid: 0,
    });

    const currencySymbol =
      CURRENCY_SYMBOLS[dto.currency] ?? `${dto.currency} `;

    try {
      const invoice = await this.prisma.$transaction(async (tx) => {
        let customer = await tx.customer.findFirst({
          where: { email: dto.customerEmail.toLowerCase() },
        });

        if (customer) {
          customer = await tx.customer.update({
            where: { id: customer.id },
            data: {
              fullname: dto.customerName,
              mobileNumber: dto.customerMobile,
              address: dto.customerAddress,
            },
          });
        } else {
          customer = await tx.customer.create({
            data: {
              fullname: dto.customerName,
              email: dto.customerEmail.toLowerCase(),
              mobileNumber: dto.customerMobile,
              address: dto.customerAddress,
            },
          });
        }

        return tx.invoice.create({
          data: {
            invoiceNumber: dto.invoiceNumber,
            invoiceReference: dto.invoiceReference,
            invoiceDate,
            dueDate,
            currency: dto.currency,
            currencySymbol,
            description: dto.description,
            status: 'Draft',
            invoiceSubTotal: totals.invoiceSubTotal,
            totalTax: totals.totalTax,
            totalDiscount: totals.totalDiscount,
            totalAmount: totals.totalAmount,
            totalPaid: totals.totalPaid,
            balanceAmount: totals.balanceAmount,
            customerId: customer.id,
            createdBy: userId,
            items: {
              create: {
                name: dto.item.name,
                quantity: dto.item.quantity,
                rate: dto.item.rate,
              },
            },
          },
          include: {
            customer: true,
            items: true,
          },
        });
      });

      return this.mapInvoice(invoice);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Invoice number must be unique');
      }
      throw error;
    }
  }

  async findAll(query: ListInvoicesQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const sortBy = query.sortBy ?? 'invoiceDate';
    const ordering = query.ordering ?? 'DESC';
    const today = startOfUtcDay(new Date());

    const where: Prisma.InvoiceWhereInput = {};

    if (query.keyword?.trim()) {
      const keyword = query.keyword.trim();
      where.OR = [
        { invoiceNumber: { contains: keyword, mode: 'insensitive' } },
        {
          customer: {
            fullname: { contains: keyword, mode: 'insensitive' },
          },
        },
      ];
    }

    if (query.fromDate || query.toDate) {
      where.invoiceDate = {};
      if (query.fromDate) {
        where.invoiceDate.gte = new Date(query.fromDate);
      }
      if (query.toDate) {
        where.invoiceDate.lte = new Date(query.toDate);
      }
    }

    if (query.status === 'Overdue') {
      where.status = { not: 'Paid' };
      where.dueDate = { lt: today };
    } else if (query.status === 'Paid') {
      where.status = 'Paid';
    } else if (query.status === 'Draft' || query.status === 'Pending') {
      where.AND = [
        { status: query.status },
        { dueDate: { gte: today } },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: { customer: true, items: true },
        orderBy: { [sortBy]: ordering.toLowerCase() as 'asc' | 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data: rows.map((row) => this.mapInvoice(row)),
      paging: { page, pageSize, total },
    };
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { customer: true, items: true },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return this.mapInvoice(invoice);
  }

  private mapInvoice(
    invoice: Prisma.InvoiceGetPayload<{
      include: { customer: true; items: true };
    }>,
  ) {
    const status = deriveInvoiceStatus(invoice.status, invoice.dueDate);

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      invoiceReference: invoice.invoiceReference,
      invoiceDate: invoice.invoiceDate.toISOString().slice(0, 10),
      dueDate: invoice.dueDate.toISOString().slice(0, 10),
      currency: invoice.currency,
      currencySymbol: invoice.currencySymbol,
      description: invoice.description,
      status,
      invoiceSubTotal: Number(invoice.invoiceSubTotal),
      totalTax: Number(invoice.totalTax),
      totalDiscount: Number(invoice.totalDiscount),
      totalAmount: Number(invoice.totalAmount),
      totalPaid: Number(invoice.totalPaid),
      balanceAmount: Number(invoice.balanceAmount),
      createdAt: invoice.createdAt.toISOString(),
      createdBy: invoice.createdBy,
      customer: {
        fullname: invoice.customer.fullname,
        email: invoice.customer.email,
        mobileNumber: invoice.customer.mobileNumber,
        address: invoice.customer.address,
      },
      items: invoice.items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        rate: Number(item.rate),
      })),
    };
  }
}
