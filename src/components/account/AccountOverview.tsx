'use client';

import type { User } from '@supabase/supabase-js';

const fields = (user: User | null) => [
  { label: 'Full Name', value: user?.user_metadata?.full_name || '—' },
  { label: 'Email', value: user?.email || '—' },
  { label: 'Phone Number', value: user?.user_metadata?.phone || '—' },
  { label: 'Gender', value: user?.user_metadata?.gender || '—' },
  { label: 'Date of Birth', value: user?.user_metadata?.date_of_birth || '—' },
];

export default function AccountOverview({ user }: { user: User | null }) {
  return (
    <div className="border border-beige bg-white p-6 sm:p-8">
      <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.28em] text-gold">
        Account Overview
      </span>
      <h3 className="font-heading text-2xl text-charcoal">Your Details</h3>

      <dl className="mt-6 grid gap-5 sm:grid-cols-2">
        {fields(user).map((field) => (
          <div key={field.label}>
            <dt className="text-[11px] uppercase tracking-[0.18em] text-charcoal/45">
              {field.label}
            </dt>
            <dd className="mt-1 text-sm text-charcoal/80">{field.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}