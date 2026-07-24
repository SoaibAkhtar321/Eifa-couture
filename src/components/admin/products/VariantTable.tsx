'use client';

import { useState } from 'react';

import DataTable, { type DataTableColumn } from '@/components/admin/DataTable';
import { formatPrice } from '@/lib/utils';
import { deleteVariant, updateInventoryQuantity } from '@/lib/admin/products-write';
import { findDuplicateVariantCombos } from '@/lib/admin/validation';
import VariantForm from './VariantForm';
import ImageManager from './ImageManager';
import type { DbInventory, DbProductImage, DbProductVariant } from '@/types/database';

type VariantRow = DbProductVariant & { inventory: DbInventory | null };

interface VariantTableProps {
  productId: string;
  basePrice: number;
  variants: VariantRow[];
  onChange: (variants: VariantRow[]) => void;
  /** Full product_images list (product-level + all variants' images).
   *  Passed through from ProductForm so each color's ImageManager can
   *  be scoped to its own slice without a separate fetch. */
  images: DbProductImage[];
  onImagesChange: (images: DbProductImage[]) => void;
}

export default function VariantTable({
  productId,
  basePrice,
  variants,
  onChange,
  images,
  onImagesChange,
}: VariantTableProps) {
  const [editingVariant, setEditingVariant] = useState<VariantRow | 'new' | null>(null);
  const [savingStockId, setSavingStockId] = useState<string | null>(null);

  const duplicateIndices = new Set(
    findDuplicateVariantCombos(variants.map((v) => ({ size: v.size, color_name: v.color_name })))
  );

  // One image gallery per color, not per size — a color's images are
  // uploaded once and attached to that color's first variant (in
  // creation order). Every other size of the same color has no images
  // of its own; the storefront resolves the whole color's gallery
  // through that single "owner" variant (see mapProductRow's
  // imagesByColor). Re-deriving this from `variants` on every render
  // (instead of storing an owner id) means it never drifts even if
  // that first variant gets deleted — the next remaining size for the
  // color simply becomes the new owner, and its (empty) gallery is
  // what the admin sees, matching what the storefront would show too.
  const colorOwners = new Map<string, VariantRow>();
  for (const v of variants) {
    if (!colorOwners.has(v.color_name)) colorOwners.set(v.color_name, v);
  }

  function handleColorImagesChange(ownerVariantId: string, updatedColorImages: DbProductImage[]) {
    const rest = images.filter((img) => img.variant_id !== ownerVariantId);
    onImagesChange([...rest, ...updatedColorImages]);
  }

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

      {colorOwners.size > 0 && (
        <div className="space-y-6 border-t border-charcoal/10 pt-6">
          <div>
            <h3 className="font-heading text-lg text-maroon">Color images</h3>
            <p className="text-xs text-charcoal/50">
              Each color has its own gallery, shared across all its sizes. Leave a color's
              gallery empty to fall back to the product's main images.
            </p>
          </div>

          {Array.from(colorOwners.entries()).map(([colorName, owner]) => (
            <ImageManager
              key={owner.id}
              productId={productId}
              variantId={owner.id}
              images={images.filter((img) => img.variant_id === owner.id)}
              onChange={(updated) => handleColorImagesChange(owner.id, updated)}
              title={`${colorName} images`}
              emptyMessage={`No images for ${colorName} yet — the product's main images will be shown instead.`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
