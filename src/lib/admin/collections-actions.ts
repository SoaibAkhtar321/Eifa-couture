'use server';

/* ============================================
   EIFA COUTURE — Collection change hook (Server Action)
   ============================================
   Collection edits are written from the browser (RLS protects them).
   After a change the browser calls this to: confirm the caller is an
   admin, write the audit log, and refresh the storefront so the new /
   edited collection page, menu links and footer show immediately.
   ============================================ */

import { revalidatePath, revalidateTag } from 'next/cache';

import { logAdminAction } from '@/lib/admin/audit-log';
import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/types/database';

export async function collectionChangedAction(input: {
  id: string;
  name: string;
  action: 'create' | 'update' | 'products';
}): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Please sign in again.' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = (profile as { role: UserRole } | null)?.role;
  if (role !== 'admin' && role !== 'superadmin') return { error: 'Only admins can manage collections.' };

  await logAdminAction({
    action: input.action === 'create' ? 'create' : 'update',
    entityType: 'collection',
    entityId: input.id,
    entityLabel: input.name,
    detail:
      input.action === 'create'
        ? 'Collection created'
        : input.action === 'products'
          ? 'Products changed'
          : 'Collection updated',
  });

  revalidateTag('storefront-content', { expire: 0 });
  revalidatePath('/collections/[slug]', 'page');
  revalidatePath('/', 'layout'); // header, footer and homepage
  return { error: null };
}
