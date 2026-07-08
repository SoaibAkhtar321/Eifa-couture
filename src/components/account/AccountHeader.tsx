'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';

import { getUserInitial } from '@/lib/user-display';
import { useAuth } from '@/hooks/useAuth';

export default function AccountHeader({ user }: { user: User | null }) {
  const router = useRouter();
  const { signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    router.push('/');
    router.refresh();
  };

  const initial = getUserInitial(user);
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-6 border border-beige bg-white p-6 sm:p-8">
      <div className="flex items-center gap-5">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-maroon font-heading text-2xl text-white">
          {initial}
        </span>
        <div>
          <h2 className="font-heading text-2xl text-charcoal sm:text-3xl">
            {user?.user_metadata?.full_name || 'Welcome'}
          </h2>
          <p className="mt-1 text-sm text-charcoal/55">{user?.email}</p>
          {memberSince && (
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-gold">
              Member since {memberSince}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/account/settings" className="btn-luxury btn-luxury-secondary">
          Edit Profile
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="btn-luxury btn-luxury-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSigningOut ? 'Signing Out…' : 'Logout'}
        </button>
      </div>
    </div>
  );
}