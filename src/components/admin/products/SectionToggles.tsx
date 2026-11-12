'use client';

import { useState } from 'react';

import { createClient } from '@/lib/supabase/client';

type Flag = 'is_featured' | 'is_best_seller' | 'is_new_arrival' | 'is_active';

const SECTION_FLAGS: { flag: Exclude<Flag, 'is_active'>; label: string }[] = [
  { flag: 'is_featured', label: 'Featured' },
  { flag: 'is_best_seller', label: 'Best seller' },
  { flag: 'is_new_arrival', label: 'New arrival' },
];

/**
 * One-click switches in the product list. Each switch controls exactly
 * one homepage section — a product only appears where it is switched on.
 */
export function SectionToggles({
  productId,
  initial,
}: {
  productId: string;
  initial: Record<Exclude<Flag, 'is_active'>, boolean>;
}) {
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState<Flag | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle(flag: Exclude<Flag, 'is_active'>) {
    const next = !values[flag];
    setSaving(flag);
    setError(null);
    setValues((v) => ({ ...v, [flag]: next }));
    const { error: updateError } = await createClient().from('products').update({ [flag]: next }).eq('id', productId);
    if (updateError) {
      setValues((v) => ({ ...v, [flag]: !next }));
      setError('Could not save');
    }
    setSaving(null);
  }

  return (
    <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
      {SECTION_FLAGS.map(({ flag, label }) => (
        <button
          key={flag}
          type="button"
          onClick={() => toggle(flag)}
          disabled={saving === flag}
          aria-pressed={values[flag]}
          title={values[flag] ? `Shown in ${label} — click to remove` : `Click to show in ${label}`}
          className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors disabled:opacity-50 ${
            values[flag]
              ? 'border-maroon bg-maroon text-white'
              : 'border-charcoal/15 bg-white text-ink-muted hover:border-maroon hover:text-maroon'
          }`}
        >
          {values[flag] ? '✓ ' : '+ '}
          {label}
        </button>
      ))}
      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </div>
  );
}

export function ActiveToggle({ productId, initial }: { productId: string; initial: boolean }) {
  const [active, setActive] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    setSaving(true);
    const next = !active;
    setActive(next);
    const { error } = await createClient().from('products').update({ is_active: next }).eq('id', productId);
    if (error) setActive(!next);
    setSaving(false);
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggle();
      }}
      disabled={saving}
      title={active ? 'Visible in store — click to hide' : 'Hidden — click to show in store'}
      className={`rounded-full px-2.5 py-1 text-xs font-medium disabled:opacity-50 ${
        active ? 'bg-green-100 text-green-800' : 'bg-charcoal/10 text-ink-muted'
      }`}
    >
      {active ? 'Live' : 'Hidden'}
    </button>
  );
}
