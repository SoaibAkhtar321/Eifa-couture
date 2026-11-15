import { requireAdmin } from '@/lib/admin/auth';
import NotificationsView from '@/components/notifications/NotificationsView';

export const metadata = { title: 'Notifications' };

export default async function AdminNotificationsPage() {
  await requireAdmin();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl text-maroon">Notifications</h1>
        <p className="mt-1 text-ink-muted">New orders, customer cancellations and return requests.</p>
      </div>

      <NotificationsView variant="admin" />
    </div>
  );
}
