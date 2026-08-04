export type CreateInvoiceFormValues = {
  customerName: string;
  customerEmail: string;
  customerMobile?: string;
  customerAddress?: string;
  invoiceNumber: string;
  invoiceReference?: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  description?: string;
  itemName: string;
  itemQuantity: number;
  itemRate: number;
  taxPercent?: number;
  discount?: number;
};

/** NestJS create-invoice body (mirrors CreateInvoiceDto). */
export type CreateInvoicePayload = {
  customerName: string;
  customerEmail: string;
  customerMobile?: string;
  customerAddress?: string;
  invoiceNumber: string;
  invoiceReference?: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  description?: string;
  taxPercent: number;
  discount: number;
  item: {
    name: string;
    quantity: number;
    rate: number;
  };
};

/** Maps create-invoice form values to the NestJS API payload. */
export function buildCreateInvoicePayload(
  values: CreateInvoiceFormValues,
): CreateInvoicePayload {
  return {
    customerName: values.customerName,
    customerEmail: values.customerEmail,
    customerMobile: values.customerMobile,
    customerAddress: values.customerAddress,
    invoiceNumber: values.invoiceNumber,
    invoiceReference: values.invoiceReference,
    invoiceDate: values.invoiceDate,
    dueDate: values.dueDate,
    currency: values.currency,
    description: values.description,
    taxPercent: values.taxPercent ?? 10,
    discount: values.discount ?? 0,
    item: {
      name: values.itemName,
      quantity: values.itemQuantity,
      rate: values.itemRate,
    },
  };
}
