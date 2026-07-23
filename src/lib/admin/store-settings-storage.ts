/* ============================================
   EIFA COUTURE — Store Branding Asset Storage
   ============================================
   Direct browser upload to the `store-assets` bucket, same "Option B"
   approach as `lib/admin/banners-storage.ts`: `is_admin()` RLS on
   `storage.objects` is the real security boundary, and this page is
   only reachable by admins anyway (`requireAdmin()`).

   Path convention (mirrors `supabase/storage/STORAGE_PLAN.md`):
     store-assets/logo.{ext}
     store-assets/favicon.{ext}

   Unlike banners there's no owning row id to namespace under — the
   store is a singleton, so the asset kind ('logo' | 'favicon') is the
   whole path. Re-uploading overwrites (upsert) rather than
   accumulating orphaned files.
   ============================================ */

import { createClient } from '@/lib/supabase/client';

const BUCKET = 'store-assets';
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB — logos/favicons are small
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'];

export type StoreAssetKind = 'logo' | 'favicon';

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `${file.name}: only JPEG, PNG, WebP, SVG, or ICO images are allowed.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `${file.name}: file is larger than 2MB.`;
  }
  return null;
}

/**
 * Uploads the store logo or favicon and returns its public URL.
 * Overwrites any previous file for the same asset kind (upsert) so
 * re-uploading doesn't accumulate orphaned files.
 */
export async function uploadStoreAsset(
  file: File,
  kind: StoreAssetKind
): Promise<{ url: string | null; error: string | null }> {
  const validationError = validateFile(file);
  if (validationError) {
    return { url: null, error: validationError };
  }

  const supabase = createClient();
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
  const path = `${kind}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });

  if (uploadError) {
    return { url: null, error: uploadError.message };
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  // cache-bust so an overwritten file shows immediately in the preview
  const url = `${publicUrlData.publicUrl}?v=${Date.now()}`;

  return { url, error: null };
}
