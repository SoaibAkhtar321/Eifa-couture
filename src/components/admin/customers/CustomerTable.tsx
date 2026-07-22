'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';

import DataTable, { type DataTableColumn } from '@/components/admin/DataTable';
import { TextField, SelectField } from '@/components/admin/FormField';
import { formatPrice, formatDate } from '@/lib/utils';
import type { CustomerListRow } from '@/lib/admin/customers-read';

interface CustomerTableProps {
  rows: CustomerListRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  currentParams: Record<string, string | undefined>;
  error: string | null;
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name', label: 'Name A–Z' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export default function CustomerTable({
  rows,
  totalCount,
  page,
  pageSize,
  currentParams,
  error,
}: CustomerTableProps) {
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

  const columns: DataTableColumn<CustomerListRow>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => <p className="font-medium text-charcoal">{row.displayName || '—'}</p>,
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (row) => row.phone ?? <span className="text-charcoal/40">—</span>,
    },
    {
      key: 'registered',
      header: 'Registered',
      render: (row) => formatDate(row.createdAt, 'short'),
    },
    {
      key: 'orders',
      header: 'Orders',
      render: (row) => row.orderCount,
    },
    {
      key: 'spent',
      header: 'Total spent',
      render: (row) => formatPrice(row.totalSpent),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            row.isActive ? 'bg-green-100 text-green-800' : 'bg-charcoal/10 text-charcoal/50'
          }`}
        >
          {row.isActive ? 'Active' : 'Inactive'}
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
            placeholder="Name or phone…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>

        <div className="w-40">
          <SelectField
            label="Status"
            value={currentParams.status ?? ''}
            onChange={(e) => updateParams({ status: e.target.value || null })}
            options={STATUS_OPTIONS}
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
        emptyMessage="No customers match these filters."
        onRowClick={(row) => router.push(`/admin/customers/${row.id}`)}
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
