'use client';

import { fetchInvoices, type Invoice, type InvoiceStatus } from '@/lib/api';
import {
  loadInvoicesListState,
  saveInvoicesListState,
} from '@/lib/invoices-list-state';
import { buildInvoiceListParams } from '@/lib/list-params';
import {
  CheckOutlined,
  CopyOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  App,
  DatePicker,
  Empty,
  Flex,
  Input,
  Pagination,
  Select,
  Table,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import dayjs, { type Dayjs } from 'dayjs';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

const COLUMN_WIDTHS = {
  invoiceNumber: 190,
  customer: 160,
  invoiceDate: 140,
  dueDate: 140,
  totalAmount: 130,
  status: 120,
} as const;

const TABLE_SCROLL_X = Object.values(COLUMN_WIDTHS).reduce((sum, w) => sum + w, 0);

const STATUS_PILLS: Array<{
  key: InvoiceStatus | 'All';
  label: string;
  className: string;
}> = [
  { key: 'All', label: 'All', className: 'is-all' },
  { key: 'Paid', label: 'Paid', className: 'is-paid' },
  { key: 'Overdue', label: 'Overdue', className: 'is-overdue' },
  { key: 'Pending', label: 'Pending', className: 'is-pending' },
  { key: 'Draft', label: 'Draft', className: 'is-draft' },
];

function statusBadgeClass(status: InvoiceStatus) {
  switch (status) {
    case 'Paid':
      return 'si-badge si-badge-paid';
    case 'Overdue':
      return 'si-badge si-badge-overdue';
    case 'Pending':
      return 'si-badge si-badge-pending';
    default:
      return 'si-badge si-badge-draft';
  }
}

function CopyInvoiceButton({ value }: { value: string }) {
  const { message } = App.useApp();
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className={`si-copy-btn${copied ? ' is-copied' : ''}`}
      aria-label="Copy invoice #"
      title="Copy invoice #"
      onClick={async (event) => {
        event.preventDefault();
        event.stopPropagation();
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          message.success('Copied');
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          message.error('Failed to copy');
        }
      }}
    >
      {copied ? <CheckOutlined /> : <CopyOutlined />}
    </button>
  );
}

export default function InvoicesPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<InvoiceStatus | undefined>();
  const [sortBy, setSortBy] = useState<'invoiceDate' | 'dueDate' | 'totalAmount'>(
    'invoiceDate',
  );
  const [ordering, setOrdering] = useState<'ASC' | 'DESC'>('DESC');
  /** When false, no column header is highlighted (cancel sort). API still uses sortBy/ordering. */
  const [sortHighlighted, setSortHighlighted] = useState(true);
  /** Bump on cancel so Ant Table remounts and sorter clicks work again */
  const [sortTableKey, setSortTableKey] = useState(0);
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [listReady, setListReady] = useState(false);
  const tableBodyRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(420);

  useEffect(() => {
    const saved = loadInvoicesListState();
    if (saved) {
      setPage(saved.page);
      setPageSize(saved.pageSize);
      setKeyword(saved.keyword);
      setSearch(saved.search);
      setStatus(saved.status);
      setSortBy(saved.sortBy);
      setOrdering(saved.ordering);
      setSortHighlighted(saved.sortHighlighted);
      if (saved.fromDate || saved.toDate) {
        setRange([
          saved.fromDate ? dayjs(saved.fromDate) : null,
          saved.toDate ? dayjs(saved.toDate) : null,
        ]);
      }
    }
    setListReady(true);
  }, []);

  useEffect(() => {
    if (!listReady) return;
    saveInvoicesListState({
      page,
      pageSize,
      keyword,
      search,
      status,
      sortBy,
      ordering,
      sortHighlighted,
      fromDate: range?.[0]?.format('YYYY-MM-DD'),
      toDate: range?.[1]?.format('YYYY-MM-DD'),
    });
  }, [
    listReady,
    page,
    pageSize,
    keyword,
    search,
    status,
    sortBy,
    ordering,
    sortHighlighted,
    range,
  ]);

  const params = useMemo(
    () =>
      buildInvoiceListParams({
        page,
        pageSize,
        sortBy,
        ordering,
        status,
        keyword: search,
        fromDate: range?.[0]?.format('YYYY-MM-DD'),
        toDate: range?.[1]?.format('YYYY-MM-DD'),
      }),
    [page, pageSize, sortBy, ordering, status, search, range],
  );

  const query = useQuery({
    queryKey: ['invoices', params],
    queryFn: () => fetchInvoices(params),
    placeholderData: keepPreviousData,
    enabled: listReady,
  });

  useEffect(() => {
    const root = tableBodyRef.current;
    if (!root) return;

    const updateScrollY = () => {
      const header = root.querySelector('.ant-table-thead') as HTMLElement | null;
      const headerH = header?.getBoundingClientRect().height ?? 47;
      setScrollY(Math.max(200, Math.floor(root.clientHeight - headerH)));
    };

    updateScrollY();
    const observer = new ResizeObserver(updateScrollY);
    observer.observe(root);
    return () => observer.disconnect();
  }, [sortTableKey, query.isFetching, pageSize]);

  const total = query.data?.paging.total ?? 0;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const sortOrderFor = (field: 'invoiceDate' | 'dueDate' | 'totalAmount') => {
    if (!sortHighlighted || sortBy !== field) return undefined;
    return ordering === 'ASC' ? ('ascend' as const) : ('descend' as const);
  };

  const columns: ColumnsType<Invoice> = [
    {
      title: 'Invoice #',
      dataIndex: 'invoiceNumber',
      width: COLUMN_WIDTHS.invoiceNumber,
      ellipsis: true,
      render: (value: string, row) => (
        <Flex align="center" gap={4} style={{ minWidth: 0, maxWidth: '100%' }}>
          <Link
            href={`/invoices/${row.invoiceId}`}
            className="si-invoice-link"
            style={{
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {value}
          </Link>
          <CopyInvoiceButton value={value} />
        </Flex>
      ),
    },
    {
      title: 'Customer',
      dataIndex: ['customer', 'fullname'],
      width: COLUMN_WIDTHS.customer,
      ellipsis: true,
      render: (value: string) => (
        <span className="si-customer-cell">{value}</span>
      ),
    },
    {
      title: 'Invoice Date',
      dataIndex: 'invoiceDate',
      key: 'invoiceDate',
      width: COLUMN_WIDTHS.invoiceDate,
      ellipsis: true,
      sorter: true,
      ...(sortOrderFor('invoiceDate')
        ? { sortOrder: sortOrderFor('invoiceDate') }
        : {}),
      render: (value: string) => <span className="si-date-cell">{value}</span>,
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: COLUMN_WIDTHS.dueDate,
      ellipsis: true,
      sorter: true,
      ...(sortOrderFor('dueDate') ? { sortOrder: sortOrderFor('dueDate') } : {}),
      render: (value: string) => <span className="si-date-cell">{value}</span>,
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: COLUMN_WIDTHS.totalAmount,
      ellipsis: true,
      sorter: true,
      ...(sortOrderFor('totalAmount')
        ? { sortOrder: sortOrderFor('totalAmount') }
        : {}),
      align: 'right',
      render: (value: number, row) => (
        <span className="si-total-cell">
          {`${row.currencySymbol}${value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: COLUMN_WIDTHS.status,
      render: (value: InvoiceStatus) => (
        <span className={statusBadgeClass(value)}>{value}</span>
      ),
    },
  ];

  return (
    <div className="si-invoices-page" data-testid="invoices-page">
      <div className="si-page-header">
        <div>
          <h1 className="si-page-title">Invoices</h1>
          <p className="si-page-subtitle">
            Search, filter, sort and paginate your invoices
          </p>
        </div>
        <Link href="/invoices/new" className="si-btn-primary">
          <PlusOutlined />
          Create Invoice
        </Link>
      </div>

      <div className="si-table-card">
        <div className="si-filter-bar">
          <Input
            className="si-search"
            allowClear
            prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
            placeholder="Search invoice # or customer…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={() => {
              setPage(1);
              setSearch(keyword.trim());
            }}
            onBlur={() => {
              const next = keyword.trim();
              if (next !== search) {
                setPage(1);
                setSearch(next);
              }
            }}
          />

          <DatePicker.RangePicker
            className="si-range"
            value={range as [Dayjs, Dayjs] | null}
            format="YYYY-MM-DD"
            placeholder={['Invoice date from', 'To']}
            allowClear
            onChange={(value) => {
              setPage(1);
              setRange(value);
            }}
          />

          <div className="si-status-pills" role="group" aria-label="Status filter">
            {STATUS_PILLS.map((pill) => {
              const active =
                pill.key === 'All' ? status === undefined : status === pill.key;
              return (
                <button
                  key={pill.key}
                  type="button"
                  className={`si-pill ${pill.className}${active ? ' is-active' : ''}`}
                  onClick={() => {
                    setPage(1);
                    setStatus(pill.key === 'All' ? undefined : pill.key);
                  }}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>

          <div className="si-rows">
            <span>Rows:</span>
            <Select
              value={pageSize}
              style={{ width: 72 }}
              options={[
                { value: 15, label: '15' },
                { value: 30, label: '30' },
                { value: 50, label: '50' },
              ]}
              onChange={(value) => {
                setPage(1);
                setPageSize(value);
              }}
            />
          </div>
        </div>

        <div className="si-table-body" ref={tableBodyRef}>
          <Table
            key={sortTableKey}
            className="si-invoices-table"
            rowKey="invoiceId"
            loading={query.isFetching}
            columns={columns}
            dataSource={query.data?.data ?? []}
            tableLayout="fixed"
            scroll={{ y: scrollY, x: TABLE_SCROLL_X }}
            pagination={false}
            locale={{
              emptyText: (
                <Empty
                  description={
                    query.isError ? 'Failed to load invoices' : 'No invoices found'
                  }
                />
              ),
            }}
            onChange={(
              _pagination: TablePaginationConfig,
              _filters,
              sorter: SorterResult<Invoice> | SorterResult<Invoice>[],
            ) => {
              const s = Array.isArray(sorter) ? sorter[0] : sorter;
              const field = String(s?.field ?? s?.columnKey ?? '');

              // Cancel / clear: Ant may omit field when order is emptied
              if (!s?.order) {
                setSortHighlighted(false);
                setSortBy('invoiceDate');
                setOrdering('DESC');
                setSortTableKey((key) => key + 1);
                return;
              }

              if (
                field !== 'invoiceDate' &&
                field !== 'dueDate' &&
                field !== 'totalAmount'
              ) {
                return;
              }

              setSortHighlighted(true);
              setSortBy(field as 'invoiceDate' | 'dueDate' | 'totalAmount');
              setOrdering(s.order === 'ascend' ? 'ASC' : 'DESC');
            }}
          />
        </div>

        <div className="si-table-footer">
          <span className="si-table-footer-meta">
            Showing {from}–{to} of {total} invoices
          </span>
          <Pagination
            className="si-pagination"
            current={page}
            pageSize={pageSize}
            total={total}
            showSizeChanger={false}
            onChange={(nextPage) => setPage(nextPage)}
          />
        </div>
      </div>
    </div>
  );
}
