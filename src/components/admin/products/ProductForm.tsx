'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { TextField, TextareaField, SelectField, NumberField, ToggleField } from '@/components/admin/FormField';
import { productFormSchema, type ProductFormValues } from '@/lib/admin/validation';
import { createProduct, updateProduct, generateUniqueSlug, type ProductInput } from '@/lib/admin/products-write';
import { generateSlug } from '@/lib/utils';
import VariantTable from './VariantTable';
import ImageManager from './ImageManager';
import type { DbCategory, DbFabric, DbInventory, DbProductImage, DbProductVariant } from '@/types/database';
import type { ProductWithRelations } from '@/lib/admin/products-read';

interface ProductFormProps {
  product?: ProductWithRelations;
  categories: DbCategory[];
  fabrics: DbFabric[];
}

const emptyValues: ProductFormValues = {
  name: '',
  slug: '',
  description: '',
  short_description: '',
  price: 0,
  compare_at_price: null,
  category_id: null,
  fabric_id: null,
  tags: [],
  is_featured: false,
  is_best_seller: false,
  is_new_arrival: false,
  is_active: true,
  seo_title: null,
  seo_description: null,
  seo_keywords: [],
  product_type: 'simple',
  sku: null,
  stock_quantity: 0,
  track_inventory: true,
  allow_backorders: false,
};

export default function ProductForm({ product, categories, fabrics }: ProductFormProps) {
  const router = useRouter();
  const isEditing = Boolean(product);

  const [values, setValues] = useState<ProductFormValues>(
    product
      ? {
          name: product.name,
          slug: product.slug,
          description: product.description,
          short_description: product.short_description,
          price: product.price,
          compare_at_price: product.compare_at_price,
          category_id: product.category_id,
          fabric_id: product.fabric_id,
          tags: product.tags,
          is_featured: product.is_featured,
          is_best_seller: product.is_best_seller,
          is_new_arrival: product.is_new_arrival,
          is_active: product.is_active,
          seo_title: product.seo_title,
          seo_description: product.seo_description,
          seo_keywords: product.seo_keywords,
          product_type: product.product_type,
          sku: product.sku,
          stock_quantity: product.stock_quantity,
          track_inventory: product.track_inventory,
          allow_backorders: product.allow_backorders,
        }
      : emptyValues
  );
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEditing);
  const [tagsInput, setTagsInput] = useState(values.tags.join(', '));
  const [keywordsInput, setKeywordsInput] = useState(values.seo_keywords.join(', '));
  const [variants, setVariants] = useState<(DbProductVariant & { inventory: DbInventory | null })[]>(
    (product?.product_variants ?? []).filter((v) => !v.is_default_variant)
  );
  const [images, setImages] = useState<DbProductImage[]>(product?.product_images ?? []);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function setField<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleNameChange(name: string) {
    setField('name', name);
    if (!slugManuallyEdited) {
      setField('slug', generateSlug(name));
    }
  }

  async function handleSlugBlur() {
    if (!values.slug) return;
    const unique = await generateUniqueSlug(values.name, product?.id);
    // only auto-correct if the current slug collides — don't clobber
    // an intentional manual slug that happens to already be unique
    if (unique !== generateSlug(values.name) && values.slug === generateSlug(values.name)) {
      setField('slug', unique);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = {
      ...values,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      seo_keywords: keywordsInput.split(',').map((k) => k.trim()).filter(Boolean),
    };

    const result = productFormSchema.safeParse(parsed);
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

    const input: ProductInput = { ...result.data };

    if (isEditing && product) {
      const { data, error } = await updateProduct(product.id, input);
      setIsSaving(false);
      if (error || !data) {
        setFormError(error ?? 'Failed to save product.');
        return;
      }
      router.refresh();
    } else {
      const { data, error } = await createProduct(input);
      setIsSaving(false);
      if (error || !data) {
        setFormError(error ?? 'Failed to create product.');
        return;
      }
      router.push(`/admin/products/${data.id}/edit`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border border-charcoal/10 bg-ivory p-6 space-y-4">
            <TextField
              label="Name"
              value={values.name}
              onChange={(e) => handleNameChange(e.target.value)}
              error={fieldErrors.name}
              required
            />
            <TextField
              label="Slug"
              value={values.slug}
              onChange={(e) => {
                setSlugManuallyEdited(true);
                setField('slug', e.target.value);
              }}
              onBlur={handleSlugBlur}
              error={fieldErrors.slug}
              hint="Used in the product URL"
              required
            />
            <TextareaField
              label="Short description"
              value={values.short_description}
              onChange={(e) => setField('short_description', e.target.value)}
              error={fieldErrors.short_description}
              hint="Shown on product cards and listings"
              rows={2}
              required
            />
            <TextareaField
              label="Full description"
              value={values.description}
              onChange={(e) => setField('description', e.target.value)}
              error={fieldErrors.description}
              rows={6}
              required
            />
          </div>

          <div className="rounded-lg border border-charcoal/10 bg-ivory p-6 space-y-4">
            <h3 className="font-heading text-lg text-maroon">SEO</h3>
            <TextField
              label="SEO title"
              value={values.seo_title ?? ''}
              onChange={(e) => setField('seo_title', e.target.value || null)}
              error={fieldErrors.seo_title}
              hint="Leave blank to use the product name"
            />
            <TextareaField
              label="SEO description"
              value={values.seo_description ?? ''}
              onChange={(e) => setField('seo_description', e.target.value || null)}
              error={fieldErrors.seo_description}
              rows={2}
            />
            <TextField
              label="SEO keywords"
              value={keywordsInput}
              onChange={(e) => setKeywordsInput(e.target.value)}
              hint="Comma-separated"
            />
          </div>

          {isEditing && product && values.product_type === 'variant' && (
            <div className="rounded-lg border border-charcoal/10 bg-ivory p-6">
              <VariantTable
                productId={product.id}
                basePrice={values.price}
                variants={variants}
                onChange={setVariants}
                images={images}
                onImagesChange={setImages}
              />
            </div>
          )}

          {isEditing && product && (
            <div className="rounded-lg border border-charcoal/10 bg-ivory p-6">
              <ImageManager
                productId={product.id}
                images={images.filter((img) => !img.variant_id)}
                onChange={(updated) => setImages([...images.filter((img) => img.variant_id), ...updated])}
                title="Main product images"
                emptyMessage="No main images yet. Used as the fallback gallery for colors without their own photos (and the only gallery for simple products)."
              />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-charcoal/10 bg-ivory p-6 space-y-4">
            <SelectField
              label="Product type"
              value={values.product_type}
              onChange={(e) => {
                const next = e.target.value as 'simple' | 'variant';
                if (next === 'simple' && variants.length > 0) {
                  setFormError('Remove all variants before switching this product back to Simple.');
                  return;
                }
                setFormError(null);
                setField('product_type', next);
              }}
              options={[
                { value: 'simple', label: 'Simple product' },
                { value: 'variant', label: 'Variant product (sizes/colors)' },
              ]}
              hint={
                values.product_type === 'simple'
                  ? 'One SKU, one stock count — no size/color options.'
                  : 'Stock is managed per size/color combination below.'
              }
            />

            {values.product_type === 'simple' ? (
              <>
                <TextField
                  label="SKU"
                  value={values.sku ?? ''}
                  onChange={(e) => setField('sku', e.target.value || null)}
                  error={fieldErrors.sku}
                  required
                />
                <NumberField
                  label="Stock quantity"
                  value={values.stock_quantity}
                  onChange={(e) => setField('stock_quantity', Number(e.target.value))}
                  error={fieldErrors.stock_quantity}
                  required
                />
                <ToggleField
                  label="Track inventory"
                  checked={values.track_inventory}
                  onChange={(v) => setField('track_inventory', v)}
                  hint="Turn off for made-to-order items with unlimited stock"
                />
                <ToggleField
                  label="Allow backorders"
                  checked={values.allow_backorders}
                  onChange={(v) => setField('allow_backorders', v)}
                  hint="Let customers order even when stock quantity is 0"
                />
              </>
            ) : (
              <p className="rounded-md border border-beige bg-beige/30 p-3 text-xs text-charcoal/60">
                Inventory is managed per variant.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-charcoal/10 bg-ivory p-6 space-y-4">
            <NumberField
              label="Price"
              step="0.01"
              value={values.price}
              onChange={(e) => setField('price', Number(e.target.value))}
              error={fieldErrors.price}
              required
            />
            <NumberField
              label="Compare-at price"
              step="0.01"
              value={values.compare_at_price ?? ''}
              onChange={(e) =>
                setField('compare_at_price', e.target.value === '' ? null : Number(e.target.value))
              }
              error={fieldErrors.compare_at_price}
              hint="Optional — shown as a strikethrough price"
            />
            <SelectField
              label="Category"
              placeholder="Select a category"
              value={values.category_id ?? ''}
              onChange={(e) => setField('category_id', e.target.value || null)}
              error={fieldErrors.category_id}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              required
            />
            <SelectField
              label="Fabric"
              placeholder="Select a fabric (optional)"
              value={values.fabric_id ?? ''}
              onChange={(e) => setField('fabric_id', e.target.value || null)}
              options={fabrics.map((f) => ({ value: f.id, label: f.name }))}
            />
            <TextField
              label="Tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              hint="Comma-separated"
            />
          </div>

          <div className="rounded-lg border border-charcoal/10 bg-ivory p-6 space-y-1">
            <ToggleField label="Active" checked={values.is_active} onChange={(v) => setField('is_active', v)} hint="Visible on the storefront" />
            <ToggleField label="Featured" checked={values.is_featured} onChange={(v) => setField('is_featured', v)} />
            <ToggleField label="Best seller" checked={values.is_best_seller} onChange={(v) => setField('is_best_seller', v)} />
            <ToggleField label="New arrival" checked={values.is_new_arrival} onChange={(v) => setField('is_new_arrival', v)} />
          </div>

          {formError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-lg bg-maroon px-5 py-3 text-sm font-medium text-ivory transition hover:bg-maroon/90 disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : isEditing ? 'Save changes' : 'Create product'}
          </button>

          {!isEditing && (
            <p className="text-xs text-charcoal/50">
              Variants and images can be added once the product is created.
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
