'use client';

import Image from 'next/image';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';

import DataTable, { type DataTableColumn } from '@/components/admin/DataTable';
import { TextField, SelectField } from '@/components/admin/FormField';
import { updateInventoryQuantity, bulkUpdateInventoryQuantities } from '@/lib/admin/inventory-write';
import type { InventoryListRow } from '@/lib/admin/inventory-read';

interface InventoryTableProps {
  rows: InventoryListRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  currentParams: Record<string, string | undefined>;
  error: string | null;
}

const SORT_OPTIONS = [
  { value: 'stock_asc', label: 'Stock, low to high' },
  { value: 'stock_desc', label: 'Stock, high to low' },
  { value: 'name', label: 'Product name A–Z' },
  { value: 'updated', label: 'Recently updated' },
];

const STOCK_OPTIONS = [
  { value: '', label: 'All stock levels' },
  { value: 'low', label: 'Low stock' },
  { value: 'out', label: 'Out of stock' },
];

function stockStatus(quantity: number, lowStockAt: number): { label: string; className: string } {
  if (quantity === 0) return { label: 'Out of stock', className: 'bg-red-100 text-red-700' };
  if (quantity <= lowStockAt) return { label: 'Low stock', className: 'bg-gold/20 text-maroon' };
  return { label: 'In stock', className: 'bg-green-100 text-green-800' };
}

export default function InventoryTable({ rows, totalCount, page, pageSize, currentParams, error }: InventoryTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(currentParams.q ?? '');

  const [editValues, setEditValues] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkQuantity, setBulkQuantity] = useState(0);
  const [isBulkSaving, setIsBulkSaving] = useState(false);

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

  async function handleSaveQuantity(row: InventoryListRow) {
    const nextQuantity = editValues[row.variant_id];
    if (nextQuantity === undefined || nextQuantity === row.quantity) return;
    if (nextQuantity < 0) {
      setRowError('Stock quantity cannot be negative.');
      return;
    }

    setRowError(null);
    setSavingId(row.variant_id);
    const { error: saveError } = await updateInventoryQuantity(row.variant_id, nextQuantity);
    setSavingId(null);

    if (saveError) {
      setRowError(saveError);
      return;
    }
    router.refresh();
  }

  function toggleSelected(variantId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(variantId)) next.delete(variantId);
      else next.add(variantId);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => (prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.variant_id))));
  }

  async function handleBulkApply() {
    if (selectedIds.size === 0 || bulkQuantity < 0) return;

    setIsBulkSaving(true);
    setRowError(null);
    const { errors } = await bulkUpdateInventoryQuantities(
      Array.from(selectedIds).map((variantId) => ({ variantId, quantity: bulkQuantity }))
    );
    setIsBulkSaving(false);

    if (errors.length > 0) {
      setRowError(`${errors.length} row${errors.length === 1 ? '' : 's'} failed to update.`);
    }
    setSelectedIds(new Set());
    router.refresh();
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const columns: DataTableColumn<InventoryListRow>[] = [
    {
      key: 'select',
      header: '',
      className: 'w-10',
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.variant_id)}
          onChange={(e) => {
            e.stopPropagation();
            toggleSelected(row.variant_id);
          }}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded border-charcoal/30"
        />
      ),
    },
    {
      key: 'product',
      header: 'Product',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-beige/60">
            {row.product_image_url ? (
              <Image
                src={row.product_image_url}
                alt={row.product_name}
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div>
            <p className="font-medium text-charcoal">{row.product_name}</p>
            <p className="text-xs text-charcoal/50">{row.sku}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'variant',
      header: 'Variant',
      render: (row) => (
        <span className="text-charcoal/80">
          {row.size} / {row.color_name}
        </span>
      ),
    },
    {
      key: 'reserved',
      header: 'Reserved',
      render: (row) => <span className="text-charcoal/60">{row.reserved}</span>,
    },
    {
      key: 'threshold',
      header: 'Low stock at',
      render: (row) => <span className="text-charcoal/60">{row.low_stock_at}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const status = stockStatus(row.quantity, row.low_stock_at);
        return (
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}>{status.label}</span>
        );
      },
    },
    {
      key: 'quantity',
      header: 'Stock',
      className: 'w-40',
      render: (row) => {
        const value = editValues[row.variant_id] ?? row.quantity;
        const isDirty = value !== row.quantity;
        return (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <input
              type="number"
              min={0}
              value={value}
              onChange={(e) =>
                setEditValues((prev) => ({ ...prev, [row.variant_id]: Number(e.target.value) }))
              }
              className="w-20 rounded-md border border-charcoal/15 bg-ivory px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-maroon/30 focus:border-maroon"
            />
            {isDirty && (
              <button
                type="button"
                disabled={savingId === row.variant_id}
                onClick={() => handleSaveQuantity(row)}
                className="rounded-md bg-maroon px-2.5 py-1.5 text-xs font-medium text-ivory transition hover:bg-maroon/90 disabled:opacity-50"
              >
                {savingId === row.variant_id ? '…' : 'Save'}
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-charcoal/10 bg-ivory p-4">
        <form onSubmit={handleSearchSubmit} className="min-w-[220px] flex-1">
          <TextField
            label="Search"
            placeholder="Product, SKU, size, or color…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>

        <div className="w-48">
          <SelectField
            label="Stock level"
            value={currentParams.stock ?? ''}
            onChange={(e) => updateParams({ stock: e.target.value || null })}
            options={STOCK_OPTIONS}
          />
        </div>

        <div className="w-48">
          <SelectField
            label="Sort by"
            value={currentParams.sort ?? 'stock_asc'}
            onChange={(e) => updateParams({ sort: e.target.value || null })}
            options={SORT_OPTIONS}
          />
        </div>
      </div>

      {rowError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{rowError}</div>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-charcoal/10 bg-beige/40 p-4">
        <label className="flex items-center gap-2 text-sm text-charcoal/70">
          <input
            type="checkbox"
            checked={rows.length > 0 && selectedIds.size === rows.length}
            onChange={toggleSelectAll}
            className="h-4 w-4 rounded border-charcoal/30"
          />
          {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all on this page'}
        </label>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={bulkQuantity}
              onChange={(e) => setBulkQuantity(Number(e.target.value))}
              className="w-24 rounded-md border border-charcoal/15 bg-ivory px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-maroon/30 focus:border-maroon"
              aria-label="Bulk stock quantity"
            />
            <button
              type="button"
              disabled={isBulkSaving}
              onClick={handleBulkApply}
              className="rounded-md bg-maroon px-4 py-2 text-sm font-medium text-ivory transition hover:bg-maroon/90 disabled:opacity-50"
            >
              {isBulkSaving ? 'Applying…' : `Set stock for ${selectedIds.size}`}
            </button>
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.variant_id}
        isLoading={isPending}
        error={error}
        emptyMessage="No variants match these filters."
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
