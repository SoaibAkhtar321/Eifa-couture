/* ============================================
   EIFA COUTURE — Admin Product Validation
   ============================================
   zod schemas for the product/variant admin forms. Kept separate from
   `lib/admin/products.ts` so ProductForm/VariantForm can import just
   the schemas (client-side, for inline field errors) without pulling
   in the Supabase query layer.
   ============================================ */

import { z } from 'zod';

export const productFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200, 'Name is too long'),
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .max(200, 'Slug is too long')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  description: z.string().trim().min(1, 'Description is required'),
  short_description: z.string().trim().min(1, 'Short description is required').max(300, 'Keep it under 300 characters'),
  price: z.coerce.number({ message: 'Price is required' }).positive('Price must be greater than 0'),
  compare_at_price: z.coerce
    .number()
    .positive('Compare-at price must be greater than 0')
    .nullable()
    .default(null),
  category_id: z.string().uuid('Select a category').nullable(),
  fabric_id: z.string().uuid().nullable().default(null),
  tags: z.array(z.string().trim().min(1)).default([]),
  is_featured: z.boolean().default(false),
  is_best_seller: z.boolean().default(false),
  is_new_arrival: z.boolean().default(false),
  is_active: z.boolean().default(true),
  seo_title: z.string().trim().max(70, 'Keep it under 70 characters for SEO').nullable().default(null),
  seo_description: z.string().trim().max(160, 'Keep it under 160 characters for SEO').nullable().default(null),
  seo_keywords: z.array(z.string().trim().min(1)).default([]),
}).refine(
  (data) => data.compare_at_price == null || data.compare_at_price > data.price,
  {
    message: 'Compare-at price must be higher than the price',
    path: ['compare_at_price'],
  }
);

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const variantFormSchema = z.object({
  size: z.string().trim().min(1, 'Size is required').max(20, 'Size is too long'),
  color_name: z.string().trim().min(1, 'Color is required').max(50, 'Color name is too long'),
  color_hex: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Enter a valid hex color, e.g. #7A1F2B')
    .nullable()
    .optional()
    .or(z.literal('')),
  sku: z.string().trim().min(1, 'SKU is required').max(64, 'SKU is too long'),
  price_override: z.coerce.number().positive('Price override must be greater than 0').nullable().optional(),
  quantity: z.coerce.number({ message: 'Stock quantity is required' }).int('Must be a whole number').min(0, 'Cannot be negative'),
  low_stock_at: z.coerce.number().int('Must be a whole number').min(0, 'Cannot be negative').default(5),
  is_active: z.boolean().default(true),
});

export type VariantFormValues = z.infer<typeof variantFormSchema>;

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .max(100, 'Slug is too long')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  description: z.string().trim().max(500, 'Keep it under 500 characters').default(''),
  image_url: z
    .string()
    .trim()
    .url('Enter a valid URL')
    .nullable()
    .or(z.literal('').transform(() => null))
    .default(null),
  parent_id: z.string().uuid().nullable().default(null),
  sort_order: z.coerce.number().int('Must be a whole number').default(0),
  is_active: z.boolean().default(true),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const collectionFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
    slug: z
      .string()
      .trim()
      .min(1, 'Slug is required')
      .max(100, 'Slug is too long')
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
    description: z.string().trim().max(500, 'Keep it under 500 characters').default(''),
    is_featured: z.boolean().default(false),
    is_active: z.boolean().default(true),
    sort_order: z.coerce.number().int('Must be a whole number').default(0),
    starts_at: z.string().trim().default(''),
    ends_at: z.string().trim().default(''),
  })
  .superRefine((data, ctx) => {
    if (data.starts_at && Number.isNaN(Date.parse(data.starts_at))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid start date', path: ['starts_at'] });
    }
    if (data.ends_at && Number.isNaN(Date.parse(data.ends_at))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid end date', path: ['ends_at'] });
    }
    if (
      data.starts_at &&
      data.ends_at &&
      !Number.isNaN(Date.parse(data.starts_at)) &&
      !Number.isNaN(Date.parse(data.ends_at)) &&
      new Date(data.starts_at) > new Date(data.ends_at)
    ) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'End date must be after the start date', path: ['ends_at'] });
    }
  });

export type CollectionFormValues = z.infer<typeof collectionFormSchema>;

/**
 * Checks a set of variants (as edited in the form, before save) for
 * duplicate size/color combinations. Returns the 0-based indices of
 * variants that collide with an earlier one in the list.
 */
export function findDuplicateVariantCombos(
  variants: { size: string; color_name: string }[]
): number[] {
  const seen = new Set<string>();
  const duplicateIndices: number[] = [];

  variants.forEach((variant, index) => {
    const key = `${variant.size.trim().toLowerCase()}::${variant.color_name.trim().toLowerCase()}`;
    if (seen.has(key)) {
      duplicateIndices.push(index);
    } else {
      seen.add(key);
    }
  });

  return duplicateIndices;
}