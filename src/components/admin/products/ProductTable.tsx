'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import Image from 'next/image';

import DataTable, { type DataTableColumn } from '@/components/admin/DataTable';
import { TextField, SelectField } from '@/components/admin/FormField';
import { formatPrice } from '@/lib/utils';
import type { DbCategory } from '@/types/database';
import type { ProductListRow } from '@/lib/admin/products';

interface ProductTableProps {
  rows: ProductListRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  categories: DbCategory[];
  currentParams: Record<string, string | undefined>;
  error: string | null;
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'updated', label: 'Recently updated' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'price', label: 'Price, low to high' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export default function ProductTable({
  rows,
  totalCount,
  page,
  pageSize,
  categories,
  currentParams,
  error,
}: ProductTableProps) {
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

  const columns: DataTableColumn<ProductListRow>[] = [
    {
      key: 'thumbnail',
      header: '',
      className: 'w-16',
      render: (row) => (
        <div className="h-12 w-12 overflow-hidden rounded-md bg-beige/60">
          {row.primary_image_url ? (
            <Image
              src={row.primary_image_url}
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
      key: 'category',
      header: 'Category',
      render: (row) => row.category_name ?? <span className="text-charcoal/40">—</span>,
    },
    {
      key: 'price',
      header: 'Price',
      render: (row) => (
        <div>
          <p>{formatPrice(row.price)}</p>
          {row.compare_at_price ? (
            <p className="text-xs text-charcoal/40 line-through">{formatPrice(row.compare_at_price)}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'active',
      header: 'Active',
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
      key: 'featured',
      header: 'Featured',
      render: (row) => (row.is_featured ? '★' : <span className="text-charcoal/30">—</span>),
    },
    {
      key: 'stock',
      header: 'Stock',
      render: (row) => (
        <span className={row.total_stock <= 5 ? 'font-medium text-amber-700' : ''}>
          {row.total_stock} {row.variant_count > 0 ? `(${row.variant_count} variants)` : ''}
        </span>
      ),
    },
    {
      key: 'updated',
      header: 'Updated',
      render: (row) => new Date(row.updated_at).toLocaleDateString('en-IN'),
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

        <div className="w-48">
          <SelectField
            label="Category"
            placeholder="All categories"
            value={currentParams.category ?? ''}
            onChange={(e) => updateParams({ category: e.target.value || null })}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
          />
        </div>

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

        <label className="flex items-center gap-2 pb-2.5 text-sm text-charcoal/70">
          <input
            type="checkbox"
            checked={currentParams.featured === '1'}
            onChange={(e) => updateParams({ featured: e.target.checked ? '1' : null })}
            className="h-4 w-4 rounded border-charcoal/30"
          />
          Featured only
        </label>

        <label className="flex items-center gap-2 pb-2.5 text-sm text-charcoal/70">
          <input
            type="checkbox"
            checked={currentParams.lowStock === '1'}
            onChange={(e) => updateParams({ lowStock: e.target.checked ? '1' : null })}
            className="h-4 w-4 rounded border-charcoal/30"
          />
          Low stock only
        </label>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        isLoading={isPending}
        error={error}
        emptyMessage="No products match these filters."
        onRowClick={(row) => router.push(`/admin/products/${row.id}/edit`)}
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
