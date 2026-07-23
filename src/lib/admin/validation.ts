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

export const homepageSectionFormSchema = z.object({
  title: z
    .string()
    .trim()
    .max(100, 'Keep it under 100 characters')
    .nullable()
    .or(z.literal('').transform(() => null))
    .default(null),
  subtitle: z
    .string()
    .trim()
    .max(300, 'Keep it under 300 characters')
    .nullable()
    .or(z.literal('').transform(() => null))
    .default(null),
  is_active: z.boolean().default(true),
  sort_order: z.coerce.number().int('Must be a whole number').default(0),
  item_limit: z.coerce
    .number()
    .int('Must be a whole number')
    .min(1, 'Must show at least 1 item')
    .max(24, 'Keep it to 24 or fewer'),
  source_collection_id: z
    .string()
    .uuid()
    .nullable()
    .or(z.literal('').transform(() => null))
    .default(null),
});

export type HomepageSectionFormValues = z.infer<typeof homepageSectionFormSchema>;

export const bannerFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(200, 'Title is too long'),
    subtitle: z.string().trim().max(300, 'Keep it under 300 characters').default(''),
    image_url: z.string().trim().min(1, 'Upload a desktop image').url('Upload a desktop image'),
    mobile_image_url: z
      .string()
      .trim()
      .url('Enter a valid URL')
      .nullable()
      .or(z.literal('').transform(() => null))
      .default(null),
    link_url: z
      .string()
      .trim()
      .url('Enter a valid URL')
      .nullable()
      .or(z.literal('').transform(() => null))
      .default(null),
    cta_label: z
      .string()
      .trim()
      .max(40, 'Keep it under 40 characters')
      .nullable()
      .or(z.literal('').transform(() => null))
      .default(null),
    sort_order: z.coerce.number().int('Must be a whole number').default(0),
    is_active: z.boolean().default(true),
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

export type BannerFormValues = z.infer<typeof bannerFormSchema>;

export const couponFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, 'Code is required')
      .max(40, 'Keep it under 40 characters')
      .regex(/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/, 'Uppercase letters, numbers, and hyphens only'),
    type: z.enum(['percentage', 'fixed'], { message: 'Select a discount type' }),
    value: z.coerce.number({ message: 'Value is required' }).positive('Value must be greater than 0'),
    min_order: z.coerce.number().min(0, 'Cannot be negative').nullable().default(null),
    max_discount: z.coerce.number().positive('Max discount must be greater than 0').nullable().default(null),
    usage_limit: z.coerce.number().int('Must be a whole number').positive('Must be greater than 0').nullable().default(null),
    per_user_limit: z.coerce.number().int('Must be a whole number').min(1, 'Must be at least 1').default(1),
    is_active: z.boolean().default(true),
    starts_at: z.string().trim().default(''),
    expires_at: z.string().trim().default(''),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'percentage' && data.value > 100) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Percentage cannot exceed 100', path: ['value'] });
    }
    if (data.starts_at && Number.isNaN(Date.parse(data.starts_at))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid start date', path: ['starts_at'] });
    }
    if (data.expires_at && Number.isNaN(Date.parse(data.expires_at))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid expiry date', path: ['expires_at'] });
    }
    if (
      data.starts_at &&
      data.expires_at &&
      !Number.isNaN(Date.parse(data.starts_at)) &&
      !Number.isNaN(Date.parse(data.expires_at)) &&
      new Date(data.starts_at) > new Date(data.expires_at)
    ) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Expiry must be after the start date', path: ['expires_at'] });
    }
  });

export type CouponFormValues = z.infer<typeof couponFormSchema>;

const optionalTrimmedString = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .nullable()
    .or(z.literal('').transform(() => null))
    .default(null);

const optionalUrlString = (message: string) =>
  z
    .string()
    .trim()
    .url(message)
    .nullable()
    .or(z.literal('').transform(() => null))
    .default(null);

export const storeSettingsFormSchema = z.object({
  store_name: z.string().trim().min(1, 'Store name is required').max(120, 'Keep it under 120 characters'),
  store_email: z
    .string()
    .trim()
    .email('Enter a valid email address')
    .nullable()
    .or(z.literal('').transform(() => null))
    .default(null),
  store_phone: optionalTrimmedString(20, 'Keep it under 20 characters'),
  address_line1: optionalTrimmedString(200, 'Keep it under 200 characters'),
  address_line2: optionalTrimmedString(200, 'Keep it under 200 characters'),
  address_city: optionalTrimmedString(100, 'Keep it under 100 characters'),
  address_state: optionalTrimmedString(100, 'Keep it under 100 characters'),
  address_pincode: optionalTrimmedString(12, 'Keep it under 12 characters'),
  address_country: z.string().trim().min(1, 'Country is required').max(100, 'Keep it under 100 characters'),

  business_legal_name: optionalTrimmedString(200, 'Keep it under 200 characters'),
  business_registration_no: optionalTrimmedString(50, 'Keep it under 50 characters'),
  gstin: optionalTrimmedString(15, 'GSTIN is at most 15 characters'),

  logo_url: optionalTrimmedString(500, 'URL is too long'),
  favicon_url: optionalTrimmedString(500, 'URL is too long'),

  social_instagram_url: optionalUrlString('Enter a valid URL'),
  social_facebook_url: optionalUrlString('Enter a valid URL'),
  social_pinterest_url: optionalUrlString('Enter a valid URL'),
  social_youtube_url: optionalUrlString('Enter a valid URL'),
  social_twitter_url: optionalUrlString('Enter a valid URL'),

  seo_default_title: optionalTrimmedString(70, 'Keep it under 70 characters for search results'),
  seo_default_description: optionalTrimmedString(160, 'Keep it under 160 characters for search results'),

  currency_code: z.string().trim().length(3, 'Use a 3-letter ISO code (e.g. INR)').toUpperCase(),
  currency_symbol: z.string().trim().min(1, 'Symbol is required').max(5, 'Keep it under 5 characters'),

  shipping_flat_rate: z.coerce.number().min(0, 'Cannot be negative').default(0),
  shipping_free_threshold: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : val),
    z.coerce.number().min(0, 'Cannot be negative').nullable()
  ).default(null),
  shipping_processing_days: z.coerce.number().int('Must be a whole number').min(0, 'Cannot be negative').default(2),

  tax_gst_percent: z.coerce.number().min(0, 'Cannot be negative').max(100, 'Cannot exceed 100').default(0),
  tax_prices_inclusive: z.boolean().default(true),
});

export type StoreSettingsFormValues = z.infer<typeof storeSettingsFormSchema>;