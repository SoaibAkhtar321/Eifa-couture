'use client';

import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';

import DataTable, { type DataTableColumn } from '@/components/admin/DataTable';
import { TextField, SelectField } from '@/components/admin/FormField';
import { formatDate } from '@/lib/utils';
import {
  RETURN_INBOX_FILTER_OPTIONS,
  RETURN_STATUS_LABELS,
  type ReturnInboxFilter,
  type ReturnInboxRow,
} from '@/lib/admin/returns-types';

interface ReturnsInboxTableProps {
  rows: ReturnInboxRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  filter: ReturnInboxFilter;
  search: string;
  error: string | null;
}

const STATUS_BADGE_CLASSES: Record<string, string> = {
  requested: 'bg-amber-100 text-amber-800',
  approved: 'bg-blue-100 text-blue-800',
  picked_up: 'bg-blue-100 text-blue-800',
  received: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  refunded: 'bg-green-100 text-green-800',
  exchanged: 'bg-green-100 text-green-800',
};

export default function ReturnsInboxTable({
  rows,
  totalCount,
  page,
  pageSize,
  filter,
  search,
  error,
}: ReturnsInboxTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(search);

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

    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ q: searchInput.trim() || null });
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const columns: DataTableColumn<ReturnInboxRow>[] = [
    {
      key: 'order',
      header: 'Order',
      render: (row) => (
        <Link
          href={`/admin/orders/${row.orderId}`}
          className="font-medium text-maroon hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.orderNumber}
        </Link>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (row) => <span className="text-charcoal">{row.customerName}</span>,
    },
    {
      key: 'item',
      header: 'Item',
      render: (row) => {
        const variant = [row.itemSize, row.itemColor].filter(Boolean).join(' · ');
        return (
          <div>
            <p className="text-charcoal">
              {row.itemName}
              {row.quantity > 1 ? ` × ${row.quantity}` : ''}
            </p>
            {(variant || row.isExchange) && (
              <p className="text-xs text-ink-muted">
                {variant}
                {row.isExchange ? `${variant ? ' · ' : ''}Exchange` : ''}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: 'reason',
      header: 'Reason',
      className: 'max-w-[260px]',
      render: (row) => (
        <p className="truncate text-ink-soft" title={row.reason}>
          {row.reason}
        </p>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            STATUS_BADGE_CLASSES[row.status] ?? 'bg-charcoal/10 text-ink-muted'
          }`}
        >
          {RETURN_STATUS_LABELS[row.status]}
        </span>
      ),
    },
    {
      key: 'requested',
      header: 'Requested',
      render: (row) => formatDate(row.requestedAt, 'short'),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-charcoal/10 bg-ivory p-4">
        <form onSubmit={handleSearchSubmit} className="min-w-[220px] flex-1">
          <TextField
            label="Search"
            placeholder="Order number…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>

        <div className="w-56">
          <SelectField
            label="Status"
            value={filter}
            onChange={(e) => updateParams({ status: e.target.value === 'open' ? null : e.target.value })}
            options={RETURN_INBOX_FILTER_OPTIONS}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        isLoading={isPending}
        error={error}
        emptyMessage={
          filter === 'open' && !search
            ? 'No open returns. New requests will show up here.'
            : 'No returns match these filters.'
        }
        onRowClick={(row) => router.push(`/admin/orders/${row.orderId}`)}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-ink-muted">
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
