'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import Image from 'next/image';

import DataTable, { type DataTableColumn } from '@/components/admin/DataTable';
import { TextField, SelectField } from '@/components/admin/FormField';
import { formatDate } from '@/lib/utils';
import type { CollectionListRow } from '@/lib/admin/collections-read';

interface CollectionTableProps {
  rows: CollectionListRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  currentParams: Record<string, string | undefined>;
  error: string | null;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export default function CollectionTable({
  rows,
  totalCount,
  page,
  pageSize,
  currentParams,
  error,
}: CollectionTableProps) {
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
    // any filter change resets pagination
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

  const columns: DataTableColumn<CollectionListRow>[] = [
    {
      key: 'thumbnail',
      header: '',
      className: 'w-16',
      render: (row) => (
        <div className="h-12 w-12 overflow-hidden rounded-md bg-beige/60">
          {row.image_url ? (
            <Image
              src={row.image_url}
              alt={row.name}
              width={48}
              height={48}
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <div>
          <p className="font-medium text-charcoal">{row.name}</p>
          <p className="text-xs text-charcoal/50">{row.slug}</p>
        </div>
      ),
    },
    {
      key: 'products',
      header: 'Products',
      render: (row) => row.product_count,
    },
    {
      key: 'featured',
      header: 'Featured',
      render: (row) => (row.is_featured ? '★' : <span className="text-charcoal/30">—</span>),
    },
    {
      key: 'active',
      header: 'Status',
      render: (row) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            row.is_active ? 'bg-green-100 text-green-800' : 'bg-charcoal/10 text-charcoal/50'
          }`}
        >
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'updated',
      header: 'Updated',
      render: (row) => formatDate(row.updated_at),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-charcoal/10 bg-ivory p-4">
        <form onSubmit={handleSearchSubmit} className="min-w-[220px] flex-1">
          <TextField
            label="Search"
            placeholder="Name or slug…"
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
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        isLoading={isPending}
        error={error}
        emptyMessage="No collections match these filters."
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
