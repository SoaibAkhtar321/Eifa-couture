'use client';

import Link from 'next/link';
import { useState } from 'react';

import AddressList from '@/components/account/AddressList';

export default function AddressesPage() {
  const [isAdding, setIsAdding] = useState(false);

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
          <button type="button" onClick={() => setIsAdding(true)} className="btn-luxury btn-luxury-primary">
            + Add Address
          </button>
        </div>

        <div className="mt-8">
          <AddressList />
        </div>
      </section>
    </main>
  );
}