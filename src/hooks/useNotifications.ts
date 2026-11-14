'use client';

/* ============================================
   EIFA COUTURE — useNotifications Hook
   ============================================
   Reads the signed-in user's notifications through the browser
   Supabase client. Row Level Security limits every query to the
   user's own rows (select / is_read update / delete); notification
   rows themselves are created by database triggers.

   Freshness: a Realtime subscription (migration adds the table to
   the supabase_realtime publication), plus a refetch whenever the tab
   becomes visible and a slow poll as a safety net. If Realtime is not
   available the bell still updates within a minute.
   ============================================ */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import { mapNotification, NOTIFICATION_COLUMNS, type AppNotification } from '@/lib/notifications';
import { createClient } from '@/lib/supabase/client';
import type { DbNotification } from '@/types/database';

const POLL_INTERVAL_MS = 60_000;

interface UseNotificationsOptions {
  /** Rows per page (the list grows by this much on "Load more"). */
  pageSize?: number;
  /** When false only the unread count is fetched (bell with panel closed). */
  listEnabled?: boolean;
}

export function useNotifications(
  userId: string | null | undefined,
  { pageSize = 10, listEnabled = true }: UseNotificationsOptions = {}
) {
  const supabase = useMemo(() => createClient(), []);
  const instanceId = useId();

  const [limit, setLimit] = useState(pageSize);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const latestRequest = useRef(0);
  const itemsRef = useRef<AppNotification[]>([]);
  const refreshRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const requestId = ++latestRequest.current;

    const [countRes, listRes] = await Promise.all([
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false),
      listEnabled
        ? supabase
            .from('notifications')
            .select(NOTIFICATION_COLUMNS)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit + 1)
        : Promise.resolve(null),
    ]);

    // A newer request started while this one was in flight.
    if (requestId !== latestRequest.current) return;

    if (!countRes.error) {
      setUnreadCount(countRes.count ?? 0);
    }

    if (listRes) {
      if (listRes.error) {
        setError('Could not load notifications. Please try again.');
      } else {
        const rows = (listRes.data ?? []) as unknown as DbNotification[];
        setHasMore(rows.length > limit);
        setItems(rows.slice(0, limit).map(mapNotification));
        setError(null);
      }
    }

    setIsLoading(false);
  }, [supabase, userId, limit, listEnabled]);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  // Initial load, and again whenever the page size / panel state changes.
  // Deferred a tick (and cancelled on cleanup) so React Strict Mode's
  // double-mount only fetches once and no state is set inside the effect body.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  // Live updates + safety nets.
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}:${instanceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => {
          void refreshRef.current();
        }
      )
      .subscribe();

    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') void refreshRef.current();
    };

    document.addEventListener('visibilitychange', refreshIfVisible);
    const timer = window.setInterval(refreshIfVisible, POLL_INTERVAL_MS);

    return () => {
      document.removeEventListener('visibilitychange', refreshIfVisible);
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [supabase, userId, instanceId]);

  const markRead = useCallback(
    async (id: string) => {
      if (!userId) return;
      const wasUnread = itemsRef.current.some((n) => n.id === id && !n.isRead);

      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      if (wasUnread) setUnreadCount((count) => Math.max(0, count - 1));

      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', userId);

      if (updateError) void refresh();
    },
    [supabase, userId, refresh]
  );

  const markAllRead = useCallback(async () => {
    if (!userId) return;

    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    const { error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (updateError) void refresh();
  }, [supabase, userId, refresh]);

  const remove = useCallback(
    async (id: string) => {
      if (!userId) return;
      const wasUnread = itemsRef.current.some((n) => n.id === id && !n.isRead);

      setItems((prev) => prev.filter((n) => n.id !== id));
      if (wasUnread) setUnreadCount((count) => Math.max(0, count - 1));

      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (deleteError) void refresh();
    },
    [supabase, userId, refresh]
  );

  const loadMore = useCallback(() => {
    setLimit((current) => current + pageSize);
  }, [pageSize]);

  return {
    items: userId ? items : [],
    unreadCount: userId ? unreadCount : 0,
    hasMore: userId ? hasMore : false,
    isLoading: userId ? isLoading : false,
    error,
    refresh,
    markRead,
    markAllRead,
    remove,
    loadMore,
  };
}
