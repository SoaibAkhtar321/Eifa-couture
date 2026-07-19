'use client';

import { useState } from 'react';

import { TextField, NumberField, ToggleField } from '@/components/admin/FormField';
import { variantFormSchema, type VariantFormValues } from '@/lib/admin/validation';
import { createVariant, updateVariant, type VariantInput } from '@/lib/admin/products';
import type { DbInventory, DbProductVariant } from '@/types/database';

interface VariantFormProps {
  productId: string;
  variant?: DbProductVariant & { inventory: DbInventory | null };
  onSaved: (variant: DbProductVariant & { inventory: DbInventory | null }) => void;
  onCancel: () => void;
}

const emptyValues: VariantFormValues = {
  size: '',
  color_name: '',
  color_hex: '',
  sku: '',
  price_override: null,
  quantity: 0,
  low_stock_at: 5,
  is_active: true,
};

export default function VariantForm({ productId, variant, onSaved, onCancel }: VariantFormProps) {
  const [values, setValues] = useState<VariantFormValues>(
    variant
      ? {
          size: variant.size,
          color_name: variant.color_name,
          color_hex: variant.color_hex ?? '',
          sku: variant.sku,
          price_override: variant.price_override,
          quantity: variant.inventory?.quantity ?? 0,
          low_stock_at: variant.inventory?.low_stock_at ?? 5,
          is_active: variant.is_active,
        }
      : emptyValues
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function setField<K extends keyof VariantFormValues>(key: K, value: VariantFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const result = variantFormSchema.safeParse(values);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        errors[String(issue.path[0])] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setIsSaving(true);

    const input: VariantInput = {
      size: result.data.size,
      color_name: result.data.color_name,
      color_hex: result.data.color_hex || null,
      sku: result.data.sku,
      price_override: result.data.price_override ?? null,
      is_active: result.data.is_active,
    };

    if (variant) {
      const { data, error } = await updateVariant(variant.id, input);
      if (error || !data) {
        setFormError(error ?? 'Failed to save variant.');
        setIsSaving(false);
        return;
      }
      onSaved({
        ...data,
        inventory: variant.inventory
          ? { ...variant.inventory, quantity: result.data.quantity, low_stock_at: result.data.low_stock_at }
          : null,
      });
    } else {
      const { data, error } = await createVariant(
        productId,
        input,
        result.data.quantity,
        result.data.low_stock_at
      );
      if (error || !data) {
        setFormError(error ?? 'Failed to create variant.');
        setIsSaving(false);
        return;
      }
      onSaved({
        ...data,
        inventory: {
          id: '',
          variant_id: data.id,
          quantity: result.data.quantity,
          reserved: 0,
          low_stock_at: result.data.low_stock_at,
          updated_at: new Date().toISOString(),
        },
      });
    }

    setIsSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 p-4">
      <div className="w-full max-w-lg rounded-lg bg-ivory p-6 shadow-xl">
        <h3 className="font-heading text-xl text-maroon">{variant ? 'Edit variant' : 'Add variant'}</h3>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Size"
              value={values.size}
              onChange={(e) => setField('size', e.target.value)}
              error={fieldErrors.size}
              required
            />
            <TextField
              label="Color name"
              value={values.color_name}
              onChange={(e) => setField('color_name', e.target.value)}
              error={fieldErrors.color_name}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Color hex"
              placeholder="#7A1F2B"
              value={values.color_hex ?? ''}
              onChange={(e) => setField('color_hex', e.target.value)}
              error={fieldErrors.color_hex}
              hint="Optional — for swatch display"
            />
            <TextField
              label="SKU"
              value={values.sku}
              onChange={(e) => setField('sku', e.target.value)}
              error={fieldErrors.sku}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <NumberField
              label="Price override"
              step="0.01"
              value={values.price_override ?? ''}
              onChange={(e) =>
                setField('price_override', e.target.value === '' ? null : Number(e.target.value))
              }
              error={fieldErrors.price_override}
              hint="Optional — leave blank to use base price"
            />
            <NumberField
              label="Stock quantity"
              value={values.quantity}
              onChange={(e) => setField('quantity', Number(e.target.value))}
              error={fieldErrors.quantity}
              required
            />
          </div>

          <NumberField
            label="Low stock threshold"
            value={values.low_stock_at}
            onChange={(e) => setField('low_stock_at', Number(e.target.value))}
            error={fieldErrors.low_stock_at}
            hint="Flagged as low stock at or below this quantity"
          />

          <ToggleField
            label="Active"
            checked={values.is_active}
            onChange={(checked) => setField('is_active', checked)}
          />

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="rounded-md px-4 py-2 text-sm font-medium text-charcoal/60 hover:bg-charcoal/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-maroon px-5 py-2 text-sm font-medium text-ivory transition hover:bg-maroon/90 disabled:opacity-50"
            >
              {isSaving ? 'Saving…' : 'Save variant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
