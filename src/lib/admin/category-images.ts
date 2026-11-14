/* ============================================
   EIFA COUTURE — Category Image Upload (browser)
   ============================================
   Same "Option B" approach as lib/admin/storage.ts: the browser uploads
   straight to Supabase Storage and `is_admin()` RLS on `storage.objects`
   (see migration 20261115120000_category_images.sql) is the real
   security boundary.

   Path convention:  category-images/{category_id}/{timestamp-random}.webp
   Filenames are unique, so they can be cached for a year and a
   replacement never shows a stale picture.

   Before upload the photo is resized (about 1200px on the long edge)
   and converted to WebP in the browser, so a 4 MB phone photo becomes
   a ~100-200 KB file and the storefront stays fast.
   ============================================ */

import { createClient } from '@/lib/supabase/client';

export const CATEGORY_IMAGE_BUCKET = 'category-images';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB (before compression)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_EDGE = 1200;

export interface PreparedCategoryImage {
  blob: Blob;
  previewUrl: string;
  extension: 'webp' | 'jpg';
}

export function validateCategoryImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Please choose a JPG, PNG or WebP picture.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'This picture is larger than 5 MB. Please choose a smaller one.';
  }
  return null;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), type, quality));
}

/** Validates, resizes and converts the picked file. Nothing is uploaded yet. */
export async function prepareCategoryImage(
  file: File
): Promise<{ data: PreparedCategoryImage | null; error: string | null }> {
  const validationError = validateCategoryImageFile(file);
  if (validationError) return { data: null, error: validationError };

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return { data: null, error: 'This picture could not be opened. Please try a different file.' };
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    return { data: null, error: 'Your browser could not process this picture.' };
  }

  context.drawImage(bitmap, 0, 0, width, height);

  let blob = await canvasToBlob(canvas, 'image/webp', 0.82);
  let extension: 'webp' | 'jpg' = 'webp';

  // Older Safari cannot encode WebP and silently returns PNG: use JPEG then.
  if (!blob || blob.type !== 'image/webp') {
    context.globalCompositeOperation = 'destination-over';
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    blob = await canvasToBlob(canvas, 'image/jpeg', 0.85);
    extension = 'jpg';
  }
  bitmap.close();

  if (!blob) return { data: null, error: 'Your browser could not process this picture.' };
  if (blob.size > MAX_FILE_SIZE) {
    return { data: null, error: 'This picture is still too large after compressing. Please choose a smaller one.' };
  }

  return { data: { blob, previewUrl: URL.createObjectURL(blob), extension }, error: null };
}

/** Uploads the prepared picture and returns its public URL. */
export async function uploadCategoryImage(
  categoryId: string,
  image: Pick<PreparedCategoryImage, 'blob' | 'extension'>
): Promise<{ url: string | null; path: string | null; error: string | null }> {
  const supabase = createClient();
  const stamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  const path = `${categoryId}/${stamp}-${random}.${image.extension}`;

  const { error } = await supabase.storage.from(CATEGORY_IMAGE_BUCKET).upload(path, image.blob, {
    cacheControl: '31536000',
    contentType: image.blob.type,
    upsert: false,
  });

  if (error) {
    return { url: null, path: null, error: `Picture upload failed: ${error.message}` };
  }

  const { data } = supabase.storage.from(CATEGORY_IMAGE_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path, error: null };
}

/** Best-effort removal of a file we just uploaded when the save then failed. */
export async function removeUploadedCategoryImage(path: string): Promise<void> {
  const supabase = createClient();
  await supabase.storage.from(CATEGORY_IMAGE_BUCKET).remove([path]);
}

/** Storage path inside the bucket for one of our public URLs (null for anything else). */
export function categoryImagePathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = `/object/public/${CATEGORY_IMAGE_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length).split('?')[0]);
}
