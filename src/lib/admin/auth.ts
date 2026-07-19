/* ============================================
   EIFA COUTURE — Admin Route Guard
   ============================================
   Server-only. This is the actual security boundary for `/admin/*` —
   client-side `role` in auth-store is UI convenience only and must
   never be trusted to gate access. Called from `src/app/admin/layout.tsx`
   on every admin request; re-queries `profiles` fresh each time rather
   than trusting anything cached client-side.
   ============================================ */

import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/types/database';

export interface AdminSession {
  userId: string;
  email: string | null;
  displayName: string;
  role: 'admin' | 'superadmin';
}

const ADMIN_ROLES: readonly UserRole[] = ['admin', 'superadmin'];

function isAdminRole(role: UserRole): role is 'admin' | 'superadmin' {
  return ADMIN_ROLES.includes(role);
}

export async function requireAdmin(nextPath = '/admin'): Promise<AdminSession> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, display_name')
    .eq('id', user.id)
    .single();

  const row = profile as { role: UserRole; display_name: string } | null;

  if (error || !row || !isAdminRole(row.role)) {
    redirect('/');
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    displayName: row.display_name,
    role: row.role,
  };
}