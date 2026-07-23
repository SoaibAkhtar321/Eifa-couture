'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';

import DataTable, { type DataTableColumn } from '@/components/admin/DataTable';
import { TextField, SelectField } from '@/components/admin/FormField';
import { formatPrice, formatDate } from '@/lib/utils';
import { ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS, type OrderListRow } from '@/lib/admin/orders-types';

interface OrderTableProps {
  rows: OrderListRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  currentParams: Record<string, string | undefined>;
  error: string | null;
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'total_desc', label: 'Total: high to low' },
  { value: 'total_asc', label: 'Total: low to high' },
];

const STATUS_FILTER_OPTIONS = [{ value: '', label: 'All statuses' }, ...ORDER_STATUS_OPTIONS];
const PAYMENT_FILTER_OPTIONS = [{ value: '', label: 'All payments' }, ...PAYMENT_STATUS_OPTIONS];

const STATUS_BADGE_CLASSES: Record<string, string> = {
  pending: 'bg-charcoal/10 text-charcoal/60',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-amber-100 text-amber-800',
  out_for_delivery: 'bg-amber-100 text-amber-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  returned: 'bg-red-100 text-red-800',
  refunded: 'bg-red-100 text-red-800',
};

const PAYMENT_BADGE_CLASSES: Record<string, string> = {
  pending: 'bg-charcoal/10 text-charcoal/60',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-red-100 text-red-800',
};

export default function OrderTable({ rows, totalCount, page, pageSize, currentParams, error }: OrderTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(currentParams.q ?? '');

  function updateParams(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });
    if (!('page' in updates)) next.delete('page');

    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`);
    });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ q: searchInput.trim() || null });
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const columns: DataTableColumn<OrderListRow>[] = [
    {
      key: 'order_number',
      header: 'Order',
      render: (row) => <p className="font-medium text-charcoal">{row.orderNumber}</p>,
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (row) => (
        <div>
          <p className="text-charcoal">{row.customerName}</p>
          <p className="text-xs text-charcoal/50">{row.customerPhone}</p>
        </div>
      ),
    },
    {
      key: 'placed_at',
      header: 'Placed',
      render: (row) => formatDate(row.placedAt, 'short'),
    },
    {
      key: 'items',
      header: 'Items',
      render: (row) => row.itemCount,
    },
    {
      key: 'total',
      header: 'Total',
      render: (row) => formatPrice(row.total),
    },
    {
      key: 'payment_status',
      header: 'Payment',
      render: (row) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
            PAYMENT_BADGE_CLASSES[row.paymentStatus] ?? 'bg-charcoal/10 text-charcoal/50'
          }`}
        >
          {row.paymentStatus}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
            STATUS_BADGE_CLASSES[row.status] ?? 'bg-charcoal/10 text-charcoal/50'
          }`}
        >
          {row.status.replace(/_/g, ' ')}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-charcoal/10 bg-ivory p-4">
        <form onSubmit={handleSearchSubmit} className="min-w-[220px] flex-1">
          <TextField
            label="Search"
            placeholder="Order number or name…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>

        <div className="w-44">
          <SelectField
            label="Status"
            value={currentParams.status ?? ''}
            onChange={(e) => updateParams({ status: e.target.value || null })}
            options={STATUS_FILTER_OPTIONS}
          />
        </div>

        <div className="w-44">
          <SelectField
            label="Payment"
            value={currentParams.payment ?? ''}
            onChange={(e) => updateParams({ payment: e.target.value || null })}
            options={PAYMENT_FILTER_OPTIONS}
          />
        </div>

        <div className="w-48">
          <SelectField
            label="Sort by"
            value={currentParams.sort ?? 'newest'}
            onChange={(e) => updateParams({ sort: e.target.value || null })}
            options={SORT_OPTIONS}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        isLoading={isPending}
        error={error}
        emptyMessage="No orders match these filters."
        onRowClick={(row) => router.push(`/admin/orders/${row.id}`)}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-charcoal/60">
          <p>
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) })}
              className="rounded-md border border-charcoal/20 px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => updateParams({ page: String(page + 1) })}
              className="rounded-md border border-charcoal/20 px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
