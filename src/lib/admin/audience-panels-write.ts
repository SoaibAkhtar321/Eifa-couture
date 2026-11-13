/* Admin write for the Women / Men / Accessories panel images
   (store_settings.panel_image_*). Browser client; RLS (`is_admin()`)
   is the security boundary. Passing null restores the built-in default. */

import { createClient as createBrowserClient } from '@/lib/supabase/client';
import type { Audience } from '@/lib/catalog';

export async function updateAudiencePanelImage(
  audience: Audience,
  url: string | null
): Promise<{ error: string | null }> {
  const supabase = createBrowserClient();
  const { error } = await supabase
    .from('store_settings')
    .update({ [`panel_image_${audience}`]: url })
    .eq('singleton', true);
  return { error: error?.message ?? null };
}
