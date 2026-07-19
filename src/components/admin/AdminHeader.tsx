'use client';

import { useRouter } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';
import { getInitials } from '@/lib/utils';
import type { AdminSession } from '@/lib/admin/auth';

export default function AdminHeader({
  admin,
  onMenuClick,
}: {
  admin: AdminSession;
  onMenuClick: () => void;
}) {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <header className="h-20 flex items-center justify-between px-6 border-b border-charcoal/10 bg-ivory">
      <button
        type="button"
        onClick={onMenuClick}
        className="lg:hidden p-2 -ml-2 text-charcoal"
        aria-label="Open menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
        </svg>
      </button>

      <div className="hidden lg:block">
        <p className="text-sm text-charcoal/50">Welcome back,</p>
        <p className="font-heading text-lg text-maroon">{admin.displayName}</p>
      </div>

      <div className="flex items-center gap-4">
        <span className="hidden sm:inline-block text-[11px] uppercase tracking-wide text-gold-dark bg-gold/10 border border-gold/30 rounded-full px-3 py-1">
          {admin.role}
        </span>

        <div className="w-9 h-9 rounded-full bg-maroon text-cream flex items-center justify-center text-sm font-medium">
          {getInitials(admin.displayName)}
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="text-sm text-charcoal/60 hover:text-maroon transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}