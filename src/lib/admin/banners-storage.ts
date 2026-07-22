/* ============================================
   EIFA COUTURE — Banner Image Storage
   ============================================
   Direct browser upload to the `banners` bucket, same "Option B"
   approach as lib/admin/storage.ts (product images): `is_admin()` RLS
   on `storage.objects` is the real security boundary, and this page
   is only reachable by admins anyway (`requireAdmin()`).

   Path convention (per supabase/storage/STORAGE_PLAN.md):
     banners/{banner_id}/desktop.{ext}
     banners/{banner_id}/mobile.{ext}

   `banners.image_url` is NOT NULL, so unlike products (where the row
   exists before any image is attached), the banner id is generated
   client-side with crypto.randomUUID() *before* the row is inserted,
   images are uploaded under that id, and the same id is passed back
   into `createBanner` as an explicit primary key. Editing an existing
   banner just reuses its real id.
   ============================================ */

import { createClient } from '@/lib/supabase/client';

const BUCKET = 'banners';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB, matches the product-images bucket convention
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export type BannerImageVariant = 'desktop' | 'mobile';

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
 * Uploads a single desktop or mobile banner image and returns its
 * public URL. Overwrites any previous file for the same banner +
 * variant (upsert) so re-uploading doesn't accumulate orphaned files.
 */
export async function uploadBannerImage(
  bannerId: string,
  file: File,
  variant: BannerImageVariant
): Promise<{ url: string | null; error: string | null }> {
  const validationError = validateFile(file);
  if (validationError) {
    return { url: null, error: validationError };
  }

  const supabase = createClient();
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${bannerId}/${variant}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });

  if (uploadError) {
    return { url: null, error: uploadError.message };
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  // cache-bust so an overwritten file shows immediately in the preview/table
  const url = `${publicUrlData.publicUrl}?v=${Date.now()}`;

  return { url, error: null };
}

function pathFromUrl(url: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.slice(index + marker.length).split('?')[0];
}

/**
 * Best-effort cleanup of a banner's desktop/mobile images from
 * Storage after its row has been deleted.
 */
export async function deleteBannerImages(images: (string | null)[]): Promise<void> {
  const supabase = createClient();
  const paths = images
    .filter((url): url is string => Boolean(url))
    .map(pathFromUrl)
    .filter((path): path is string => Boolean(path));

  if (paths.length === 0) return;
  await supabase.storage.from(BUCKET).remove(paths);
}
