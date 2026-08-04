import type { InvoiceStatus } from '@/lib/api';

const STORAGE_KEY = 'si:invoicesListState';

export type InvoicesListPersistedState = {
  page: number;
  pageSize: number;
  keyword: string;
  search: string;
  status?: InvoiceStatus;
  sortBy: 'invoiceDate' | 'dueDate' | 'totalAmount';
  ordering: 'ASC' | 'DESC';
  sortHighlighted: boolean;
  fromDate?: string;
  toDate?: string;
};

export function loadInvoicesListState(): InvoicesListPersistedState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as InvoicesListPersistedState;
  } catch {
    return null;
  }
}

export function saveInvoicesListState(state: InvoicesListPersistedState) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / private mode
  }
}
