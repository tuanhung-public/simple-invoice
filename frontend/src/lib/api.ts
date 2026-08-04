import axios from 'axios';
import { clearToken, getToken } from './auth';
import type { CreateInvoicePayload } from './create-invoice-payload';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      clearToken();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export type InvoiceStatus = 'Draft' | 'Pending' | 'Paid' | 'Overdue';

export type Invoice = {
  invoiceId: string;
  invoiceNumber: string;
  invoiceReference?: string | null;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  currencySymbol: string;
  description?: string | null;
  status: InvoiceStatus;
  invoiceSubTotal: number;
  totalTax: number;
  totalDiscount: number;
  totalAmount: number;
  totalPaid: number;
  balanceAmount: number;
  createdAt: string;
  createdBy: string;
  customer: {
    fullname: string;
    email: string;
    mobileNumber?: string | null;
    address?: string | null;
  };
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    rate: number;
  }>;
};

export type PagedInvoices = {
  data: Invoice[];
  paging: { page: number; pageSize: number; total: number };
};

export type ListInvoicesParams = {
  page?: number;
  pageSize?: number;
  sortBy?: 'invoiceDate' | 'dueDate' | 'totalAmount';
  ordering?: 'ASC' | 'DESC';
  status?: InvoiceStatus;
  keyword?: string;
  fromDate?: string;
  toDate?: string;
};

export async function login(email: string, password: string) {
  const { data } = await api.post<{
    accessToken: string;
    user: { id: string; email: string; fullname: string };
  }>('/auth/login', { email, password });
  return data;
}

export async function fetchMe() {
  const { data } = await api.get<{
    id: string;
    email: string;
    fullname: string;
  }>('/auth/me');
  return data;
}

export async function fetchInvoices(params: ListInvoicesParams) {
  const { data } = await api.get<PagedInvoices>('/invoices', { params });
  return data;
}

export async function fetchInvoice(id: string) {
  const { data } = await api.get<Invoice>(`/invoices/${id}`);
  return data;
}

export async function createInvoice(payload: CreateInvoicePayload) {
  const { data } = await api.post<Invoice>('/invoices', payload);
  return data;
}
