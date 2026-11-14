'use client';

/* ============================================
   EIFA COUTURE — Notifications list (full page body)
   ============================================
   Shared by /account/notifications (customers) and
   /admin/notifications (order / return alerts for admins). The page
   wrappers own the heading; this component owns the list, filters,
   mark-all-read, delete and "Load more".
   ============================================ */

import { useState } from 'react';
import Link from 'next/link';

import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';

import NotificationItem from './NotificationItem';

type Filter = 'all' | 'unread';

export default function NotificationsView({ variant = 'storefront' }: { variant?: 'storefront' | 'admin' }) {
  const { user, isLoading: authLoading } = useAuth();
  const [filter, setFilter] = useState<Filter>('all');

  const { items, unreadCount, hasMore, isLoading, error, markRead, markAllRead, remove, loadMore } =
    useNotifications(user?.id, { pageSize: 20, listEnabled: true });

  const visible = filter === 'unread' ? items.filter((n) => !n.isRead) : items;

  const card = variant === 'admin' ? 'border border-charcoal/10 bg-white' : 'border border-beige bg-white';

  if (authLoading) {
    return (
      <div className={`${card} p-8 text-center`}>
        <p className="text-sm text-ink-muted">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`${card} p-8 text-center`}>
        <p className="text-sm text-ink-muted">Sign in to see your notifications.</p>
        <Link
          href="/login?next=/account/notifications"
          className="btn-luxury btn-luxury-primary mt-5 inline-flex"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const tabClass = (active: boolean) =>
    `min-h-[40px] px-4 text-[11px] uppercase tracking-[0.16em] transition-colors ${
      active ? 'bg-maroon text-white' : 'bg-white text-ink-soft hover:text-maroon'
    }`;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex overflow-hidden border border-beige" role="tablist" aria-label="Filter notifications">
          <button type="button" role="tab" aria-selected={filter === 'all'} onClick={() => setFilter('all')} className={tabClass(filter === 'all')}>
            All
          </button>
          <button type="button" role="tab" aria-selected={filter === 'unread'} onClick={() => setFilter('unread')} className={tabClass(filter === 'unread')}>
            Unread{unreadCount > 0 ? ` (${unreadCount})` : ''}
          </button>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void markAllRead()}
            className="min-h-[40px] text-[11px] uppercase tracking-[0.16em] text-maroon transition-colors hover:text-gold"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className={card}>
        {isLoading && items.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-muted">Loading notifications…</p>
        ) : error && items.length === 0 ? (
          <p className="p-8 text-center text-sm text-red-600">{error}</p>
        ) : visible.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-muted">
            {filter === 'unread' ? 'You are all caught up.' : 'No notifications yet.'}
          </p>
        ) : (
          <ul>
            {visible.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onOpen={(n) => {
                  if (!n.isRead) void markRead(n.id);
                }}
                onDelete={(n) => void remove(n.id)}
              />
            ))}
          </ul>
        )}
      </div>

      {hasMore && (
        <div className="mt-5 text-center">
          <button type="button" onClick={loadMore} className="btn-luxury btn-luxury-secondary inline-flex">
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
