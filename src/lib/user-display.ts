/* ============================================
   EIFA COUTURE — User Display Helpers
   ============================================
   Single source of truth for deriving a display name/initial/avatar
   from the raw Supabase auth user. Used by Header and AccountDashboard
   so this logic isn't duplicated in two places.
   ============================================ */

type MinimalAuthUser =
  | {
      email?: string | null;
      user_metadata?: Record<string, unknown> | null;
    }
  | null
  | undefined;

export function getUserDisplayName(user: MinimalAuthUser): string {
  const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
  return (
    (metadata.full_name as string | undefined) ||
    (metadata.name as string | undefined) ||
    user?.email?.split('@')[0] ||
    'Customer'
  );
}

export function getUserInitial(user: MinimalAuthUser): string {
  return getUserDisplayName(user).trim()[0]?.toUpperCase() ?? 'A';
}

export function getUserAvatarUrl(user: MinimalAuthUser): string | null {
  const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
  return (
    (metadata.avatar_url as string | undefined) ||
    (metadata.picture as string | undefined) ||
    null
  );
}