/* ============================================
   EIFA COUTURE — Product Image Storage
   ============================================
   Direct browser upload to the `product-images` bucket (Option B —
   see 0006_product_images_storage.sql for the bucket + RLS setup).
   No Route Handler: `is_admin()` RLS on both `storage.objects` and
   the `product_images` table is the actual security boundary, and
   this page is only reachable by admins anyway (`requireAdmin()`).

   Path convention (per supabase/storage/STORAGE_PLAN.md):
     product-images/{product_id}/{filename}
   Filenames are hashed/timestamped client-side to avoid collisions
   and to keep them CDN-cacheable/immutable.
   ============================================ */

import { createClient } from '@/lib/supabase/client';
import type { DbProductImage } from '@/types/database';

const BUCKET = 'product-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB, matches the bucket's file_size_limit
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface ImageUploadError {
  fileName: string;
  message: string;
}

function sanitizeFileName(originalName: string): string {
  const ext = originalName.split('.').pop()?.toLowerCase() ?? 'jpg';
  const stamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `${stamp}-${random}.${ext}`;
}

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `${file.name}: only JPEG, PNG, or WebP images are allowed.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `${file.name}: file is larger than 5MB.`;
  }
  return null;
}

/**
 * Uploads one image to Storage and inserts its `product_images` row.
 * `sortOrder` should be the next available position (e.g. current
 * image count); `isPrimary` should be true only for a product's first
 * image unless the caller is explicitly changing the primary image.
 */
export async function uploadProductImage(
  productId: string,
  file: File,
  sortOrder: number,
  isPrimary: boolean,
  variantId: string | null = null
): Promise<{ data: DbProductImage | null; error: string | null }> {
  const validationError = validateFile(file);
  if (validationError) {
    return { data: null, error: validationError };
  }

  const supabase = createClient();
  // Matches supabase/storage/STORAGE_PLAN.md: product-images/{product_id}/{variant_id?}/{filename}
  const path = variantId
    ? `${productId}/${variantId}/${sanitizeFileName(file.name)}`
    : `${productId}/${sanitizeFileName(file.name)}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '31536000', // 1 year — filenames are unique/immutable
    upsert: false,
  });

  if (uploadError) {
    return { data: null, error: uploadError.message };
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { data: row, error: insertError } = await supabase
    .from('product_images')
    .insert({
      product_id: productId,
      variant_id: variantId,
      url: publicUrlData.publicUrl,
      alt_text: '',
      sort_order: sortOrder,
      is_primary: isPrimary,
    })
    .select()
    .single();

  if (insertError) {
    // roll back the uploaded file so storage doesn't accumulate orphans
    await supabase.storage.from(BUCKET).remove([path]);
    return { data: null, error: insertError.message };
  }

  return { data: row as DbProductImage, error: null };
}

/**
 * Uploads multiple images sequentially (so sort_order stays correct
 * and one bad file doesn't abort the rest). Returns successfully
 * created rows plus any per-file errors.
 */
export async function uploadProductImages(
  productId: string,
  files: File[],
  startingSortOrder: number,
  hasExistingPrimary: boolean,
  variantId: string | null = null
): Promise<{ data: DbProductImage[]; errors: ImageUploadError[] }> {
  const data: DbProductImage[] = [];
  const errors: ImageUploadError[] = [];

  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    const isPrimary = !hasExistingPrimary && i === 0 && data.length === 0;
    const result = await uploadProductImage(productId, file, startingSortOrder + i, isPrimary, variantId);

    if (result.error || !result.data) {
      errors.push({ fileName: file.name, message: result.error ?? 'Upload failed.' });
    } else {
      data.push(result.data);
    }
  }

  return { data, errors };
}

function pathFromUrl(url: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.slice(index + marker.length);
}

export async function deleteProductImage(image: Pick<DbProductImage, 'id' | 'url'>): Promise<{ error: string | null }> {
  const supabase = createClient();

  const { error: rowError } = await supabase.from('product_images').delete().eq('id', image.id);
  if (rowError) {
    return { error: rowError.message };
  }

  const path = pathFromUrl(image.url);
  if (path) {
    // best-effort — the DB row is already gone either way
    await supabase.storage.from(BUCKET).remove([path]);
  }

  return { error: null };
}

export async function setPrimaryImage(
  productId: string,
  imageId: string,
  variantId: string | null = null
): Promise<{ error: string | null }> {
  const supabase = createClient();

  // Scoped to the same gallery only: product-level (variant_id is null)
  // and each variant's gallery each have their own primary now, so
  // clearing must not cross that boundary — see migration 0012.
  let clearQuery = supabase
    .from('product_images')
    .update({ is_primary: false })
    .eq('product_id', productId)
    .neq('id', imageId);

  clearQuery = variantId ? clearQuery.eq('variant_id', variantId) : clearQuery.is('variant_id', null);

  const { error: clearError } = await clearQuery;

  if (clearError) {
    return { error: clearError.message };
  }

  const { error: setError } = await supabase
    .from('product_images')
    .update({ is_primary: true })
    .eq('id', imageId);

  return { error: setError?.message ?? null };
}

/**
 * Persists a new image order after a drag-and-drop reorder. Takes the
 * full ordered list of image IDs for the product and writes matching
 * sort_order values.
 */
export async function reorderProductImages(
  orderedImageIds: string[]
): Promise<{ error: string | null }> {
  const supabase = createClient();

  const updates = orderedImageIds.map((id, index) =>
    supabase.from('product_images').update({ sort_order: index }).eq('id', id)
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);

  return { error: failed?.error?.message ?? null };
}