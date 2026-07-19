import Link from 'next/link';

export const metadata = { title: 'Notifications | Eifa Couture' };

export default function NotificationsPage() {
  return (
    <main className="bg-ivory">
      <section className="luxury-container py-10 sm:py-14 lg:py-20">
        <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-charcoal/45 sm:text-[11px]">
          <Link href="/account" className="hover:text-maroon">Account</Link>
          <span>/</span>
          <span className="text-charcoal/70">Notifications</span>
        </nav>

        <h1 className="font-heading text-4xl text-charcoal sm:text-5xl">Notifications</h1>
        <div className="mt-8 border border-beige bg-white p-8 text-center">
          <p className="text-sm text-charcoal/55">No notifications yet.</p>
        </div>
      </section>
    </main>
  );
}