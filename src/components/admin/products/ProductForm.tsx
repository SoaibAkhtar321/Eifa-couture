'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { TextField, TextareaField, SelectField, NumberField, ToggleField } from '@/components/admin/FormField';
import ConfirmDialog from '@/components/admin/ui/ConfirmDialog';
import { useToast } from '@/components/admin/ui/Toaster';
import {
  MIN_PRODUCT_IMAGES,
  PRODUCT_IMAGE_HINT,
  productFormSchema,
  type ProductFormValues,
} from '@/lib/admin/validation';
import {
  updateProduct,
  generateUniqueSlug,
  softDeleteProduct,
  type ProductInput,
} from '@/lib/admin/products-write';
import {
  SIZE_OPTIONS,
  fromStoredPrices,
  quickCreateProduct,
  toStoredPrices,
} from '@/lib/admin/product-quick-create';
import { AUDIENCE_OPTIONS } from '@/lib/catalog';
import { generateSlug } from '@/lib/utils';
import VariantTable from './VariantTable';
import ImageManager from './ImageManager';
import ImageDropzone from './ImageDropzone';
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
  audience: null,
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

const cardClass = 'rounded-lg border border-charcoal/10 bg-ivory p-5 sm:p-6 space-y-4';

function parseMoney(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : NaN;
}

export default function ProductForm({ product, categories, fabrics }: ProductFormProps) {
  const router = useRouter();
  const toast = useToast();
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
          audience: product.audience,
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

  // Owner-facing price model: "Price" is the full price, "Discounted price"
  // is what customers pay. Stored as compare_at_price / price.
  const initialPrices = product
    ? fromStoredPrices(product.price, product.compare_at_price)
    : { fullPrice: 0, discounted: null as number | null };
  const [fullPriceInput, setFullPriceInput] = useState(isEditing ? String(initialPrices.fullPrice) : '');
  const [discountInput, setDiscountInput] = useState(
    initialPrices.discounted !== null ? String(initialPrices.discounted) : ''
  );

  const [tagsInput, setTagsInput] = useState(values.tags.join(', '));
  const [keywordsInput, setKeywordsInput] = useState(values.seo_keywords.join(', '));
  const [variants, setVariants] = useState<(DbProductVariant & { inventory: DbInventory | null })[]>(
    (product?.product_variants ?? []).filter((v) => !v.is_default_variant)
  );
  const [images, setImages] = useState<DbProductImage[]>(product?.product_images ?? []);

  // Create-only state
  const [photos, setPhotos] = useState<File[]>([]);
  const [sizeStock, setSizeStock] = useState<Record<string, string>>({});

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  function setField<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  // Category choices only include categories of the chosen audience, so a
  // product can never be given a category that doesn't belong to it.
  const categoryOptions = categories
    .filter((c) => values.audience !== null && c.audience === values.audience)
    .map((c) => ({ value: c.id, label: c.name }));

  function handleAudienceChange(next: ProductFormValues['audience']) {
    setValues((prev) => {
      const currentCategory = categories.find((c) => c.id === prev.category_id);
      const keepCategory = currentCategory && next !== null && currentCategory.audience === next;
      return { ...prev, audience: next, category_id: keepCategory ? prev.category_id : null };
    });
  }

  function toggleSize(size: string) {
    setSizeStock((prev) => {
      const next = { ...prev };
      if (size in next) delete next[size];
      else next[size] = '';
      return next;
    });
  }

  function validateEssentials(): { full: number; discounted: number | null } | null {
    const errors: Record<string, string> = {};
    const full = parseMoney(fullPriceInput);
    const discounted = parseMoney(discountInput);

    if (!values.name.trim()) errors.name = 'Please enter the product name';
    if (!values.audience) errors.audience = 'Choose who this product is for';
    if (!values.category_id) errors.category_id = 'Choose a category';
    if (full === null || Number.isNaN(full) || full <= 0) errors.price = 'Enter the price (more than 0)';
    if (discounted !== null) {
      if (Number.isNaN(discounted) || discounted <= 0) errors.discount = 'Enter a valid discounted price';
      else if (full !== null && !Number.isNaN(full) && discounted >= full)
        errors.discount = 'Discounted price must be lower than the price';
    }

    if (!isEditing) {
      if (values.is_active && photos.length < MIN_PRODUCT_IMAGES)
        errors.photos = `Add at least ${MIN_PRODUCT_IMAGES} photos (you have ${photos.length}). ${PRODUCT_IMAGE_HINT}`;
      const sizes = Object.keys(sizeStock);
      for (const s of sizes) {
        const q = Number(sizeStock[s]);
        if (sizeStock[s].trim() === '' || !Number.isInteger(q) || q < 0) {
          errors.sizes = `Enter how many pieces you have in size ${s} (0 or more)`;
          break;
        }
      }
      if (sizes.length === 0 && (!Number.isInteger(values.stock_quantity) || values.stock_quantity < 0)) {
        errors.stock_quantity = 'Enter a whole number, 0 or more';
      }
    }

    if (isEditing && product && values.is_active && !product.is_active) {
      const count = images.filter((img) => !img.variant_id).length;
      if (count < MIN_PRODUCT_IMAGES)
        errors.photos = `Add at least ${MIN_PRODUCT_IMAGES} photos before turning this product on (you have ${count}). ${PRODUCT_IMAGE_HINT}`;
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError('Please fix the highlighted fields.');
      return null;
    }
    return { full: full as number, discounted };
  }

  async function handleSlugBlur() {
    if (!values.slug || !isEditing) return;
    const unique = await generateUniqueSlug(values.name, product?.id);
    if (unique !== generateSlug(values.name) && values.slug === generateSlug(values.name)) {
      setField('slug', unique);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const prices = validateEssentials();
    if (!prices) return;

    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    const seo_keywords = keywordsInput.split(',').map((k) => k.trim()).filter(Boolean);

    setIsSaving(true);

    if (!isEditing) {
      const sizes = Object.keys(sizeStock).map((size) => ({ size, quantity: Number(sizeStock[size]) }));
      // keep the size order stable (XS..XXL) regardless of click order
      sizes.sort((a, b) => SIZE_OPTIONS.indexOf(a.size as never) - SIZE_OPTIONS.indexOf(b.size as never));

      const result = await quickCreateProduct({
        name: values.name.trim(),
        audience: values.audience!,
        category_id: values.category_id!,
        fullPrice: prices.full,
        discountedPrice: prices.discounted,
        sizes,
        stockQuantity: values.stock_quantity,
        is_featured: values.is_featured,
        is_new_arrival: values.is_new_arrival,
        photos,
        overrides: {
          slug: values.slug.trim() || undefined,
          sku: values.sku?.trim() || undefined,
          description: values.description,
          short_description: values.short_description,
          fabric_id: values.fabric_id,
          tags,
          is_best_seller: values.is_best_seller,
          is_active: values.is_active,
          seo_title: values.seo_title?.trim() || null,
          seo_description: values.seo_description?.trim() || null,
          seo_keywords,
          track_inventory: values.track_inventory,
          allow_backorders: values.allow_backorders,
        },
      });
      setIsSaving(false);

      if (result.error || !result.product) {
        setFormError(result.error ?? 'Failed to create product.');
        return;
      }
      if (result.photoWarning) {
        toast.error(result.photoWarning);
        router.push(`/admin/products/${result.product.id}/edit`);
        return;
      }
      toast.success(values.is_active ? 'Product created. It is now live in the store.' : 'Product created (hidden from the store).');
      router.push('/admin/products');
      return;
    }

    // ----- edit -----
    const stored = toStoredPrices(prices.full, prices.discounted);
    const parsed = productFormSchema.safeParse({
      ...values,
      ...stored,
      tags,
      seo_keywords,
      slug: values.slug.trim() || generateSlug(values.name),
    });
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        errors[String(issue.path[0])] = issue.message;
      });
      setFieldErrors(errors);
      setFormError(parsed.error.issues[0]?.message ?? 'Please check the form.');
      setIsSaving(false);
      return;
    }

    const input: ProductInput = { ...parsed.data };
    const { data, error } = await updateProduct(product!.id, input);
    setIsSaving(false);
    if (error || !data) {
      setFormError(error ?? 'Failed to save product.');
      return;
    }
    toast.success('Changes saved.');
    router.refresh();
  }

  async function handleDelete() {
    if (!product) return;
    setIsDeleting(true);
    const { error } = await softDeleteProduct(product.id);
    setIsDeleting(false);
    if (error) {
      setConfirmDelete(false);
      toast.error(`Could not delete the product: ${error}`);
      return;
    }
    toast.success('Product deleted.');
    router.push('/admin/products');
    router.refresh();
  }

  const selectedSizes = SIZE_OPTIONS.filter((s) => s in sizeStock);
  const isVariantProduct = values.product_type === 'variant';

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6 pb-28" noValidate>
      {/* ---------- 1. The basics ---------- */}
      <section className={cardClass} aria-labelledby="basics-heading">
        <h2 id="basics-heading" className="font-heading text-lg text-maroon">
          The basics
        </h2>
        <TextField
          label="Product name"
          value={values.name}
          onChange={(e) => setField('name', e.target.value)}
          error={fieldErrors.name}
          placeholder="e.g. Ivory Chikankari Kurta"
          required
        />
        <SelectField
          label="Who is it for?"
          placeholder="Select Women, Men or Accessories"
          value={values.audience ?? ''}
          onChange={(e) => handleAudienceChange((e.target.value || null) as ProductFormValues['audience'])}
          error={fieldErrors.audience}
          options={AUDIENCE_OPTIONS}
          hint="The product only appears in this part of the store"
          required
        />
        <SelectField
          label="Category"
          placeholder={values.audience ? 'Select a category' : 'Choose who it is for first'}
          value={values.category_id ?? ''}
          onChange={(e) => setField('category_id', e.target.value || null)}
          error={fieldErrors.category_id}
          options={categoryOptions}
          disabled={values.audience === null}
          required
        />
      </section>

      {/* ---------- 2. Photos ---------- */}
      <section className={cardClass} aria-labelledby="photos-heading">
        <h2 id="photos-heading" className="font-heading text-lg text-maroon">
          Photos
        </h2>
        {isEditing && product ? (
          <>
          <ImageManager
            productId={product.id}
            images={images.filter((img) => !img.variant_id)}
            onChange={(updated) => setImages([...images.filter((img) => img.variant_id), ...updated])}
            title="Product photos"
            emptyMessage="No photos yet. Drag photos here or choose them to upload."
            minimum={MIN_PRODUCT_IMAGES}
            protectMinimum={product.is_active}
          />
          {fieldErrors.photos && <p className="text-xs text-red-600">{fieldErrors.photos}</p>}
          </>
        ) : (
          <ImageDropzone files={photos} minimum={MIN_PRODUCT_IMAGES} onChange={setPhotos} error={fieldErrors.photos} />
        )}
      </section>

      {/* ---------- 3. Price & stock ---------- */}
      <section className={cardClass} aria-labelledby="price-heading">
        <h2 id="price-heading" className="font-heading text-lg text-maroon">
          Price and stock
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            label="Price (₹)"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={fullPriceInput}
            onChange={(e) => setFullPriceInput(e.target.value)}
            error={fieldErrors.price}
            hint="The full price of the product"
            required
          />
          <NumberField
            label="Discounted price (₹)"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={discountInput}
            onChange={(e) => setDiscountInput(e.target.value)}
            error={fieldErrors.discount ?? fieldErrors.compare_at_price}
            hint="Optional. What customers pay. The full price shows struck through."
          />
        </div>

        {!isEditing && (
          <>
            <fieldset>
              <legend className="text-sm font-medium text-charcoal">Available sizes</legend>
              <p className="mt-1 text-xs text-ink-muted">
                Tap the sizes you have. Leave all unselected for a product with no sizes (like a bag).
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SIZE_OPTIONS.map((size) => {
                  const on = size in sizeStock;
                  return (
                    <button
                      key={size}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleSize(size)}
                      className={`min-h-[44px] min-w-[56px] rounded-lg border px-4 text-sm font-medium transition-colors ${
                        on
                          ? 'border-maroon bg-maroon text-ivory'
                          : 'border-charcoal/25 bg-ivory text-charcoal hover:border-maroon'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
              {fieldErrors.sizes && <p className="mt-2 text-xs text-red-600">{fieldErrors.sizes}</p>}
            </fieldset>

            {selectedSizes.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {selectedSizes.map((size) => (
                  <NumberField
                    key={size}
                    label={`Pieces in ${size}`}
                    inputMode="numeric"
                    min="0"
                    step="1"
                    value={sizeStock[size]}
                    onChange={(e) => setSizeStock((prev) => ({ ...prev, [size]: e.target.value }))}
                  />
                ))}
              </div>
            ) : (
              <NumberField
                label="Stock quantity"
                inputMode="numeric"
                min="0"
                step="1"
                value={values.stock_quantity}
                onChange={(e) => setField('stock_quantity', Number(e.target.value))}
                error={fieldErrors.stock_quantity}
                hint="How many pieces you have"
                required
              />
            )}
          </>
        )}

        {isEditing && !isVariantProduct && (
          <NumberField
            label="Stock quantity"
            inputMode="numeric"
            min="0"
            step="1"
            value={values.stock_quantity}
            onChange={(e) => setField('stock_quantity', Number(e.target.value))}
            error={fieldErrors.stock_quantity}
            hint="How many pieces you have"
            required
          />
        )}
        {isEditing && isVariantProduct && (
          <p className="rounded-md border border-beige bg-beige/30 p-3 text-sm text-ink-soft">
            Sizes and stock are listed under <strong>Advanced options → Sizes and colours</strong>.
          </p>
        )}
      </section>

      {/* ---------- Description (visible, not hidden under Advanced) ---------- */}
      <section className={cardClass} aria-labelledby="description-heading">
        <h2 id="description-heading" className="font-heading text-lg text-maroon">
          Product description
        </h2>
        <p className="text-sm text-ink-muted">
          Tell customers about this piece — the fabric, the Chikankari work, fit and how to care for it.
        </p>
        <TextareaField
          label="Short description"
          value={values.short_description}
          onChange={(e) => setField('short_description', e.target.value)}
          error={fieldErrors.short_description}
          hint="One or two lines shown on product cards. Left blank, the product name is used."
          placeholder="e.g. Hand-embroidered white Chikankari kurta on soft cotton"
          rows={2}
        />
        <TextareaField
          label="Full description"
          value={values.description}
          onChange={(e) => setField('description', e.target.value)}
          error={fieldErrors.description}
          hint="Shown on the product page under “Description”. Left blank, the product name is used."
          placeholder="Describe the fabric, embroidery work, fit, colours and care instructions."
          rows={6}
        />
      </section>

      {/* ---------- 4. Where it shows ---------- */}
      <section className={cardClass} aria-labelledby="show-heading">
        <h2 id="show-heading" className="font-heading text-lg text-maroon">
          Show on the homepage
        </h2>
        <ToggleField
          label="Show in Featured"
          checked={values.is_featured}
          onChange={(v) => setField('is_featured', v)}
          hint="Appears in the homepage “Featured” section"
        />
        <ToggleField
          label="Show in New Arrivals"
          checked={values.is_new_arrival}
          onChange={(v) => setField('is_new_arrival', v)}
          hint="Appears in the homepage “New Arrivals” section"
        />
      </section>

      {/* ---------- 5. Advanced options (collapsed) ---------- */}
      <details className="group rounded-lg border border-charcoal/10 bg-ivory">
        <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 sm:px-6">
          <span>
            <span className="block font-heading text-lg text-maroon">Advanced options</span>
            <span className="block text-xs text-ink-muted">
              SEO, SKU, sizes and colours. You can leave all of this alone.
            </span>
          </span>
          <span aria-hidden="true" className="text-xl text-maroon transition-transform group-open:rotate-180">
            ▾
          </span>
        </summary>

        <div className="space-y-6 border-t border-charcoal/10 p-5 sm:p-6">
          <div className="space-y-4">
            <TextField
              label="Web address (slug)"
              value={values.slug}
              onChange={(e) => setField('slug', e.target.value)}
              onBlur={handleSlugBlur}
              error={fieldErrors.slug}
              hint={isEditing ? 'Used in the product link' : 'Created automatically from the name if left blank'}
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

          <div className="space-y-1">
            <ToggleField
              label="Live in store"
              checked={values.is_active}
              onChange={(v) => setField('is_active', v)}
              hint="Turn off to hide this product from customers"
            />
            <ToggleField
              label="Best seller"
              checked={values.is_best_seller}
              onChange={(v) => setField('is_best_seller', v)}
              hint="Appears in the homepage “Best Sellers” section"
            />
          </div>

          {(!isVariantProduct || !isEditing) && (
            <div className="space-y-4">
              <TextField
                label="SKU"
                value={values.sku ?? ''}
                onChange={(e) => setField('sku', e.target.value || null)}
                error={fieldErrors.sku}
                hint={
                  isEditing
                    ? 'Stock-keeping code for this product'
                    : 'Created automatically if left blank (only used when no sizes are chosen)'
                }
              />
              <ToggleField
                label="Track stock"
                checked={values.track_inventory}
                onChange={(v) => setField('track_inventory', v)}
                hint="Turn off for made-to-order items with unlimited stock"
              />
              <ToggleField
                label="Allow orders when out of stock"
                checked={values.allow_backorders}
                onChange={(v) => setField('allow_backorders', v)}
                hint="Customers can order even when stock is 0"
              />
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-heading text-base text-maroon">Search engine (SEO)</h3>
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

          {isEditing && product && (
            <div className="space-y-4">
              <h3 className="font-heading text-base text-maroon">Sizes and colours</h3>
              <SelectField
                label="Product type"
                value={values.product_type}
                onChange={(e) => {
                  const next = e.target.value as 'simple' | 'variant';
                  if (next === 'simple' && variants.length > 0) {
                    setFormError('Remove all sizes/colours before switching this product back to Simple.');
                    return;
                  }
                  setFormError(null);
                  setField('product_type', next);
                }}
                options={[
                  { value: 'simple', label: 'No sizes or colours' },
                  { value: 'variant', label: 'Has sizes and/or colours' },
                ]}
                hint={
                  values.product_type === 'simple'
                    ? 'One stock count for the whole product.'
                    : 'Stock is managed per size/colour below. Save the form after switching.'
                }
              />
              {isVariantProduct && (
                <VariantTable
                  productId={product.id}
                  basePrice={values.price}
                  variants={variants}
                  onChange={setVariants}
                  images={images}
                  onImagesChange={setImages}
                />
              )}
            </div>
          )}
        </div>
      </details>

      {formError && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {formError}
        </div>
      )}

      {/* Sticky action bar so Save is always in reach on a phone */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-charcoal/10 bg-ivory/95 px-4 py-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="min-h-[52px] flex-1 rounded-lg bg-maroon px-5 text-base font-medium text-ivory transition hover:bg-maroon/90 disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : isEditing ? 'Save changes' : 'Add product'}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="min-h-[52px] rounded-lg border border-red-300 px-5 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this product?"
        message={`“${values.name}” will be removed from the store. Past orders are not affected.`}
        confirmLabel="Yes, delete it"
        cancelLabel="No, keep it"
        destructive
        busy={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </form>
  );
}
