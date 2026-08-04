import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { InvoiceStatus, PrismaClient } from '@prisma/client';
import {
  CURRENCY_SYMBOLS,
  calculateInvoiceTotals,
} from '../src/common/invoice-math';

const prisma = new PrismaClient();

const REVIEWER_USER_ID = 'ad1e0902-1928-4345-b513-60c86c94fc91';
const APPENDIX_INVOICE_ID = '099ca7da-a290-40fa-93b9-1c43ae7bb887';
const APPENDIX_ITEM_ID = 'b1c2d3e4-0000-0000-0000-000000000001';

const FIRST_NAMES = [
  'Alice',
  'Bob',
  'Carol',
  'David',
  'Eva',
  'Frank',
  'Grace',
  'Henry',
  'Ivy',
  'Jack',
  'Karen',
  'Leo',
  'Mia',
  'Noah',
  'Olivia',
];

const ITEM_NAMES = [
  'Consulting hours',
  'Software license',
  'Support retainer',
  'Design package',
  'Cloud hosting',
  'Training workshop',
  'Hardware kit',
  'API integration',
];

function daysFrom(base: Date, offset: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
}

async function main() {
  console.log('Seeding database...');

  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  const user = await prisma.user.create({
    data: {
      id: REVIEWER_USER_ID,
      email: 'reviewer@101digital.io',
      passwordHash,
      fullname: '101 Digital Reviewer',
    },
  });

  const appendixCustomer = await prisma.customer.create({
    data: {
      fullname: 'Paul',
      email: 'paul@101digital.io',
      mobileNumber: '947717364111',
      address: 'Singapore',
    },
  });

  await prisma.invoice.create({
    data: {
      id: APPENDIX_INVOICE_ID,
      invoiceNumber: 'IV1780488206995',
      invoiceReference: '#5721662',
      invoiceDate: new Date('2026-06-03'),
      dueDate: new Date('2026-07-03'),
      currency: 'AUD',
      currencySymbol: 'AU$',
      description: 'Invoice is issued to Kanglee',
      status: InvoiceStatus.Pending,
      invoiceSubTotal: 2000,
      totalTax: 200,
      totalDiscount: 20,
      totalAmount: 2180,
      totalPaid: 1451.34,
      balanceAmount: 728.66,
      customerId: appendixCustomer.id,
      createdBy: user.id,
      createdAt: new Date('2026-06-03T12:03:26.995Z'),
      items: {
        create: {
          id: APPENDIX_ITEM_ID,
          name: 'Honda RC150',
          quantity: 2,
          rate: 1000,
        },
      },
    },
  });

  const statuses: InvoiceStatus[] = [
    InvoiceStatus.Draft,
    InvoiceStatus.Pending,
    InvoiceStatus.Paid,
  ];
  const currencies = ['AUD', 'USD', 'GBP', 'SGD'] as const;
  const today = new Date('2026-08-03T00:00:00.000Z');

  for (let i = 1; i <= 30; i++) {
    const name = FIRST_NAMES[i % FIRST_NAMES.length];
    const email = `${name.toLowerCase()}${i}@example.com`;
    const customer = await prisma.customer.create({
      data: {
        fullname: name,
        email,
        mobileNumber: `9${String(400000000 + i)}`,
        address: i % 2 === 0 ? 'Singapore' : 'Sydney',
      },
    });

    const status = statuses[i % statuses.length];
    const quantity = (i % 5) + 1;
    const rate = 100 * ((i % 8) + 1);
    const taxPercent = 10;
    const discount = i % 3 === 0 ? 25 : 0;
    const totals = calculateInvoiceTotals({
      quantity,
      rate,
      taxPercent,
      discount,
      totalPaid: 0,
    });

    const invoiceDate = daysFrom(today, -40 + i);
    const dueDate =
      status === InvoiceStatus.Paid
        ? daysFrom(invoiceDate, 30)
        : i % 4 === 0
          ? daysFrom(today, -5 - (i % 7))
          : daysFrom(invoiceDate, 20 + (i % 10));

    const totalPaid =
      status === InvoiceStatus.Paid ? totals.totalAmount : i % 5 === 0 ? 50 : 0;
    const balanceAmount =
      Math.round((totals.totalAmount - totalPaid + Number.EPSILON) * 100) / 100;

    const currency = currencies[i % currencies.length];

    await prisma.invoice.create({
      data: {
        invoiceNumber: `IV-SEED-${String(i).padStart(4, '0')}`,
        invoiceReference: `#REF-${1000 + i}`,
        invoiceDate,
        dueDate,
        currency,
        currencySymbol: CURRENCY_SYMBOLS[currency],
        description: `Seeded invoice ${i} for ${name}`,
        status,
        invoiceSubTotal: totals.invoiceSubTotal,
        totalTax: totals.totalTax,
        totalDiscount: totals.totalDiscount,
        totalAmount: totals.totalAmount,
        totalPaid,
        balanceAmount,
        customerId: customer.id,
        createdBy: user.id,
        items: {
          create: {
            name: ITEM_NAMES[i % ITEM_NAMES.length],
            quantity,
            rate,
          },
        },
      },
    });
  }

  console.log('Seed complete.');
  console.log('Default login: reviewer@101digital.io / Password123!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
