'use client';

/* ============================================
   EIFA COUTURE — Notification Bell
   ============================================
   Bell with an unread badge. Used in the storefront header and the
   admin header (admins receive order / return alerts through the same
   table). Below the `sm` breakpoint the storefront bell is a plain
   link to the notifications page (the Flipkart / Meesho pattern); from
   `sm` up it opens a dropdown with the latest items.
   ============================================ */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import type { AppNotification } from '@/lib/notifications';

import NotificationItem from './NotificationItem';

type Variant = 'storefront' | 'admin';

function BellIcon({ size }: { size: number }) {
  return (
    <svg
      className="pointer-events-none"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.55"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="pointer-events-none absolute right-1 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-maroon px-1 font-body text-[10px] font-medium text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}

export default function NotificationBell({ variant = 'storefront' }: { variant?: Variant }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const { items, unreadCount, isLoading, error, markRead, markAllRead } = useNotifications(userId, {
    pageSize: 8,
    listEnabled: open,
  });

  const viewAllHref = variant === 'admin' ? '/admin/notifications' : '/account/notifications';

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!userId) return null;

  const label = unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications';

  const buttonClass =
    variant === 'admin'
      ? 'relative flex h-10 w-10 items-center justify-center rounded-full text-charcoal transition-colors hover:bg-charcoal/5 hover:text-maroon'
      : 'tap-feedback relative flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center text-ink-soft hover:text-maroon cursor-pointer';

  const handleOpenItem = (notification: AppNotification) => {
    if (!notification.isRead) void markRead(notification.id);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      {/* Phones: straight to the page (storefront only). */}
      {variant === 'storefront' && (
        <Link
          href={viewAllHref}
          className={`${buttonClass} sm:hidden`}
          aria-label={label}
        >
          <BellIcon size={21} />
          <Badge count={unreadCount} />
        </Link>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`${buttonClass} ${variant === 'storefront' ? 'hidden sm:flex' : ''}`}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <BellIcon size={variant === 'admin' ? 20 : 21} />
        <Badge count={unreadCount} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full z-(--z-dropdown) mt-2 w-[min(92vw,380px)] border border-beige bg-white shadow-[0_18px_48px_rgba(0,0,0,0.12)]"
        >
          <div className="flex items-center justify-between border-b border-beige px-4 py-3">
            <p className="font-heading text-lg text-charcoal">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-[11px] uppercase tracking-[0.14em] text-maroon transition-colors hover:text-gold"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {isLoading && items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-muted">Loading…</p>
            ) : error && items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-muted">{error}</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-muted">No notifications yet.</p>
            ) : (
              <ul>
                {items.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onOpen={handleOpenItem}
                  />
                ))}
              </ul>
            )}
          </div>

          <Link
            href={viewAllHref}
            onClick={() => setOpen(false)}
            className="block border-t border-beige px-4 py-3 text-center text-[11px] uppercase tracking-[0.16em] text-maroon transition-colors hover:bg-beige/50"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
