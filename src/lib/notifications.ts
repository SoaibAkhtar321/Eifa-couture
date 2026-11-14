/* ============================================
   EIFA COUTURE — In-app Notifications (shared helpers)
   ============================================
   Pure functions + types, importable anywhere. Notification rows are
   WRITTEN only by database triggers (migration 20261114170000); the
   browser can read its own rows, flip is_read and delete its own rows.
   ============================================ */

import type { DbNotification, NotificationType } from '@/types/database';

/** UI shape. Named AppNotification to avoid clashing with the DOM `Notification`. */
export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  orderId: string | null;
  isRead: boolean;
  createdAt: string;
}

export const NOTIFICATION_COLUMNS =
  'id, user_id, type, title, message, link_url, is_read, order_id, dedupe_key, created_at';

export function mapNotification(row: DbNotification): AppNotification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    link: row.link_url,
    orderId: row.order_id,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

/** Only same-site paths are followed; anything else is ignored. */
export function safeNotificationLink(link: string | null): string | null {
  if (!link) return null;
  return link.startsWith('/') && !link.startsWith('//') ? link : null;
}

/** "just now", "5m ago", "3h ago", "Yesterday", "12 Nov". */
export function formatNotificationTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '';

  const diffMs = now.getTime() - then.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;

  return then.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    ...(then.getFullYear() !== now.getFullYear() ? { year: 'numeric' as const } : {}),
  });
}
