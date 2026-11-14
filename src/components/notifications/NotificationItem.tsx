'use client';

import Link from 'next/link';

import {
  formatNotificationTime,
  safeNotificationLink,
  type AppNotification,
} from '@/lib/notifications';

interface NotificationItemProps {
  notification: AppNotification;
  /** Called when the row is opened (mark read, close panel, ...). */
  onOpen: (notification: AppNotification) => void;
  /** Shows a delete button when provided (full page only). */
  onDelete?: (notification: AppNotification) => void;
}

function OrderIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 8 12 3 3 8v8l9 5 9-5z" />
      <path d="m3 8 9 5 9-5" />
      <path d="M12 13v8" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

export default function NotificationItem({ notification, onOpen, onDelete }: NotificationItemProps) {
  const href = safeNotificationLink(notification.link);

  const body = (
    <>
      <span
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          notification.isRead ? 'bg-beige text-ink-muted' : 'bg-maroon/10 text-maroon'
        }`}
      >
        {notification.type === 'order' ? <OrderIcon /> : <BellIcon />}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span
            className={`block text-sm leading-snug ${
              notification.isRead ? 'text-ink-soft' : 'font-medium text-charcoal'
            }`}
          >
            {notification.title}
          </span>
          {!notification.isRead && (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-maroon" aria-label="Unread" />
          )}
        </span>
        {notification.message && (
          <span className="mt-0.5 line-clamp-2 block text-[13px] leading-snug text-ink-muted">
            {notification.message}
          </span>
        )}
        <span className="mt-1 block text-[11px] text-ink-muted">
          {formatNotificationTime(notification.createdAt)}
        </span>
      </span>
    </>
  );

  const rowClass = `flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-beige/50 ${
    notification.isRead ? '' : 'bg-gold/5'
  } ${onDelete ? 'pr-12' : ''}`;

  return (
    <li className="relative border-b border-beige last:border-b-0">
      {href ? (
        <Link href={href} onClick={() => onOpen(notification)} className={rowClass}>
          {body}
        </Link>
      ) : (
        <button type="button" onClick={() => onOpen(notification)} className={rowClass}>
          {body}
        </button>
      )}

      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(notification)}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-beige hover:text-maroon"
          aria-label="Delete notification"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </li>
  );
}
