'use client';

import type { DbAddress } from '@/types/database';

const typeLabels: Record<string, string> = { home: 'Home', work: 'Work', other: 'Other' };

interface AddressCardProps {
  address: DbAddress;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  isBusy: boolean;
}

export default function AddressCard({ address, onEdit, onDelete, onSetDefault, isBusy }: AddressCardProps) {
  return (
    <div className="border border-beige bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="font-heading text-xl text-charcoal">{address.full_name}</h3>
          <span className="border border-charcoal/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-charcoal/55">
            {typeLabels[address.type] ?? address.type}
          </span>
          {address.is_default && (
            <span className="bg-gold/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-gold">
              Default
            </span>
          )}
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-charcoal/70">
        {address.address_line1}
        {address.address_line2 ? `, ${address.address_line2}` : ''}
        <br />
        {address.city}, {address.state} — {address.pincode}
        <br />
        Phone: {address.phone}
      </p>

      <div className="mt-5 flex flex-wrap gap-5 text-sm">
        <button type="button" onClick={onEdit} disabled={isBusy} className="text-maroon transition-colors hover:text-gold disabled:opacity-50">
          Edit
        </button>
        <button type="button" onClick={onDelete} disabled={isBusy} className="text-charcoal/60 transition-colors hover:text-red-700 disabled:opacity-50">
          Delete
        </button>
        {!address.is_default && (
          <button type="button" onClick={onSetDefault} disabled={isBusy} className="text-charcoal/60 transition-colors hover:text-maroon disabled:opacity-50">
            Set as Default
          </button>
        )}
      </div>
    </div>
  );
}