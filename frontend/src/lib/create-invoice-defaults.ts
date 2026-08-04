export type CreateInvoiceInitialValues = {
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  customerAddress: string;
  invoiceNumber: string;
  invoiceReference: string;
  /** YYYY-MM-DD */
  invoiceDate: string;
  /** YYYY-MM-DD */
  dueDate: string;
  currency: string;
  description: string;
  itemName: string;
  itemQuantity: number;
  itemRate: number;
  taxPercent: number;
  discount: number;
};

const CUSTOMERS = [
  { name: 'Ava Chen', emailLocal: 'ava.chen', mobile: '+61 400 111 222', city: 'Sydney' },
  { name: 'Ben Okonkwo', emailLocal: 'ben.okonkwo', mobile: '+61 400 333 444', city: 'Melbourne' },
  { name: 'Chloe Nguyen', emailLocal: 'chloe.nguyen', mobile: '+61 400 555 666', city: 'Brisbane' },
  { name: 'Diego Alvarez', emailLocal: 'diego.alvarez', mobile: '+61 400 777 888', city: 'Perth' },
  { name: 'Elena Rossi', emailLocal: 'elena.rossi', mobile: '+61 400 999 000', city: 'Adelaide' },
] as const;

const ITEMS = [
  'Consulting hours',
  'API integration package',
  'Monthly support retainer',
  'Design workshop',
  'Cloud migration setup',
] as const;

const CURRENCIES = ['AUD', 'USD', 'GBP', 'EUR', 'SGD'] as const;

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomRate() {
  return Number((Math.random() * 900 + 50).toFixed(2));
}

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addUtcDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

/** Random filled values for the create-invoice form (demo / review convenience). */
export function buildRandomCreateInvoiceInitialValues(): CreateInvoiceInitialValues {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  const customer = pick(CUSTOMERS);
  const invoiceDate = addUtcDays(new Date(), -randomInt(0, 14));
  const dueDate = addUtcDays(invoiceDate, randomInt(14, 45));

  return {
    customerName: customer.name,
    customerEmail: `${customer.emailLocal}.${suffix.toLowerCase()}@example.com`,
    customerMobile: customer.mobile,
    customerAddress: `${randomInt(1, 200)} Example St, ${customer.city}`,
    invoiceNumber: `IV-${suffix}`,
    invoiceReference: `PO-${suffix}`,
    invoiceDate: toDateOnly(invoiceDate),
    dueDate: toDateOnly(dueDate),
    currency: pick(CURRENCIES),
    description: `Services for ${customer.name} — ${suffix}`,
    itemName: pick(ITEMS),
    itemQuantity: randomInt(1, 5),
    itemRate: randomRate(),
    taxPercent: pick([0, 5, 10, 15]),
    discount: pick([0, 10, 25, 50]),
  };
}
