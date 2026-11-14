import Link from 'next/link';

import NotificationsView from '@/components/notifications/NotificationsView';

export const metadata = { title: 'Notifications | Eifa Couture' };

export default function NotificationsPage() {
  return (
    <main className="bg-ivory">
      <section className="luxury-container py-10 sm:py-14 lg:py-20">
        <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-ink-muted sm:text-[11px]">
          <Link href="/account" className="hover:text-maroon">Account</Link>
          <span>/</span>
          <span className="text-ink-soft">Notifications</span>
        </nav>

        <h1 className="font-heading text-4xl text-charcoal sm:text-5xl">Notifications</h1>
        <p className="mt-2 text-sm text-ink-muted">Updates about your orders, returns and refunds.</p>

        <div className="mt-8">
          <NotificationsView variant="storefront" />
        </div>
      </section>
    </main>
  );
}
