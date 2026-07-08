import Link from 'next/link';

export const metadata = { title: 'Saved Addresses | Eifa Couture' };

export default function AddressesPage() {
  return (
    <main className="bg-ivory">
      <section className="luxury-container py-10 sm:py-14 lg:py-20">
        <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-charcoal/45 sm:text-[11px]">
          <Link href="/account" className="hover:text-maroon">Account</Link>
          <span>/</span>
          <span className="text-charcoal/70">Saved Addresses</span>
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-heading text-4xl text-charcoal sm:text-5xl">Saved Addresses</h1>
          <button type="button" className="btn-luxury btn-luxury-primary">+ Add Address</button>
        </div>

        <div className="mt-8 border border-beige bg-white p-8 text-center">
          <p className="text-sm text-charcoal/55">No saved addresses yet.</p>
        </div>
      </section>
    </main>
  );
}