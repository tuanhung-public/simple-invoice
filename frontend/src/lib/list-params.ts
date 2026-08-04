export type ListParamInput = {
  page?: number;
  pageSize?: number;
  sortBy?: 'invoiceDate' | 'dueDate' | 'totalAmount';
  ordering?: 'ASC' | 'DESC';
  status?: string;
  keyword?: string;
  fromDate?: string;
  toDate?: string;
};

export function buildInvoiceListParams(input: ListParamInput) {
  const params: Record<string, string | number> = {
    page: input.page ?? 1,
    pageSize: input.pageSize ?? 15,
    sortBy: input.sortBy ?? 'invoiceDate',
    ordering: input.ordering ?? 'DESC',
  };

  if (input.status) params.status = input.status;
  if (input.keyword?.trim()) params.keyword = input.keyword.trim();
  if (input.fromDate) params.fromDate = input.fromDate;
  if (input.toDate) params.toDate = input.toDate;

  return params;
}
