'use client';

import { useState } from 'react';

import DataTable, { type DataTableColumn } from '@/components/admin/DataTable';
import { formatPrice } from '@/lib/utils';
import { deleteVariant, updateInventoryQuantity } from '@/lib/admin/products-write';
import { findDuplicateVariantCombos } from '@/lib/admin/validation';
import VariantForm from './VariantForm';
import type { DbInventory, DbProductVariant } from '@/types/database';

type VariantRow = DbProductVariant & { inventory: DbInventory | null };

interface VariantTableProps {
  productId: string;
  basePrice: number;
  variants: VariantRow[];
  onChange: (variants: VariantRow[]) => void;
}

export default function VariantTable({ productId, basePrice, variants, onChange }: VariantTableProps) {
  const [editingVariant, setEditingVariant] = useState<VariantRow | 'new' | null>(null);
  const [savingStockId, setSavingStockId] = useState<string | null>(null);

  const duplicateIndices = new Set(
    findDuplicateVariantCombos(variants.map((v) => ({ size: v.size, color_name: v.color_name })))
  );

  async function handleStockChange(variant: VariantRow, quantity: number) {
    if (Number.isNaN(quantity) || quantity < 0) return;

    setSavingStockId(variant.id);
    const { error } = await updateInventoryQuantity(variant.id, quantity);
    setSavingStockId(null);

    if (error) {
      alert(`Failed to update stock: ${error}`);
      return;
    }

    onChange(
      variants.map((v) =>
        v.id === variant.id ? { ...v, inventory: v.inventory ? { ...v.inventory, quantity } : v.inventory } : v
      )
    );
  }

  async function handleDelete(variant: VariantRow) {
    if (!confirm(`Delete variant ${variant.size} / ${variant.color_name}?`)) return;

    const { error } = await deleteVariant(variant.id);
    if (error) {
      alert(`Failed to delete variant: ${error}`);
      return;
    }
    onChange(variants.filter((v) => v.id !== variant.id));
  }

  function handleSaved(saved: VariantRow) {
    const exists = variants.some((v) => v.id === saved.id);
    onChange(exists ? variants.map((v) => (v.id === saved.id ? saved : v)) : [...variants, saved]);
    setEditingVariant(null);
  }

  const columns: DataTableColumn<VariantRow>[] = [
    {
      key: 'combo',
      header: 'Size / Color',
      render: (row) => {
        const index = variants.indexOf(row);
        return (
          <div>
            <p className="font-medium text-charcoal">
              {row.size} / {row.color_name}
            </p>
            {duplicateIndices.has(index) && (
              <p className="text-xs text-red-600">Duplicate size/color combo</p>
            )}
          </div>
        );
      },
    },
    { key: 'sku', header: 'SKU', render: (row) => row.sku },
    {
      key: 'price',
      header: 'Price',
      render: (row) => (row.price_override ? formatPrice(row.price_override) : formatPrice(basePrice)),
    },
    {
      key: 'stock',
      header: 'Stock',
      render: (row) => (
        <input
          type="number"
          min={0}
          defaultValue={row.inventory?.quantity ?? 0}
          disabled={savingStockId === row.id}
          onBlur={(e) => {
            const next = Number(e.target.value);
            if (next !== row.inventory?.quantity) handleStockChange(row, next);
          }}
          className="w-20 rounded-md border border-charcoal/15 bg-ivory px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-maroon/30"
        />
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
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex gap-3 text-sm">
          <button
            type="button"
            onClick={() => setEditingVariant(row)}
            className="font-medium text-maroon hover:underline"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row)}
            className="font-medium text-red-600 hover:underline"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg text-maroon">Variants</h3>
        <button
          type="button"
          onClick={() => setEditingVariant('new')}
          className="rounded-md border border-maroon/30 px-4 py-2 text-sm font-medium text-maroon transition hover:bg-maroon/5"
        >
          Add variant
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={variants}
        getRowKey={(row) => row.id}
        emptyMessage="No variants yet. Add at least one to make this product purchasable."
      />

      {editingVariant && (
        <VariantForm
          productId={productId}
          variant={editingVariant === 'new' ? undefined : editingVariant}
          onSaved={handleSaved}
          onCancel={() => setEditingVariant(null)}
        />
      )}
    </div>
  );
}
