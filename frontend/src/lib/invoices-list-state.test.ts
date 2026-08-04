import { beforeEach, describe, expect, it } from 'vitest';
import {
  loadInvoicesListState,
  saveInvoicesListState,
  type InvoicesListPersistedState,
} from './invoices-list-state';

const sample: InvoicesListPersistedState = {
  page: 2,
  pageSize: 30,
  keyword: 'IV',
  search: 'IV',
  status: 'Overdue',
  sortBy: 'dueDate',
  ordering: 'ASC',
  sortHighlighted: false,
  fromDate: '2026-01-01',
  toDate: '2026-08-01',
};

describe('invoices-list-state', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('returns null when nothing is stored', () => {
    expect(loadInvoicesListState()).toBeNull();
  });

  it('round-trips list filter state through sessionStorage', () => {
    saveInvoicesListState(sample);
    expect(loadInvoicesListState()).toEqual(sample);
  });

  it('returns null when stored JSON is invalid', () => {
    sessionStorage.setItem('si:invoicesListState', '{not-json');
    expect(loadInvoicesListState()).toBeNull();
  });
});
