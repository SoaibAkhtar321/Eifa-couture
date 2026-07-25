'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { cn } from '@/lib/utils';
import { FINANCE_PRESET_OPTIONS, type FinancePreset } from '@/lib/admin/finance-range';

interface FinanceRangeSwitchProps {
  active: FinancePreset;
  customStart?: string;
  customEnd?: string;
}

export default function FinanceRangeSwitch({ active, customStart, customEnd }: FinanceRangeSwitchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [start, setStart] = useState(customStart ?? '');
  const [end, setEnd] = useState(customEnd ?? '');

  function applyPreset(value: FinancePreset) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('range', value);
    if (value !== 'custom') {
      params.delete('start');
      params.delete('end');
    }
    router.push(`/admin/finance?${params.toString()}`);
  }

  function applyCustom() {
    if (!start || !end) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('range', 'custom');
    params.set('start', start);
    params.set('end', end);
    router.push(`/admin/finance?${params.toString()}`);
  }

  return (
    <div className="flex flex-col sm:items-end gap-2">
      <div className="inline-flex flex-wrap gap-1 rounded-md border border-charcoal/10 bg-ivory p-1">
        {FINANCE_PRESET_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => applyPreset(option.value)}
            className={cn(
              'px-3 py-1.5 text-sm rounded transition-colors',
              active === option.value ? 'bg-maroon text-cream' : 'text-charcoal/60 hover:text-maroon'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {active === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="rounded-md border border-charcoal/15 bg-cream px-2 py-1 text-sm"
          />
          <span className="text-charcoal/40 text-sm">to</span>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="rounded-md border border-charcoal/15 bg-cream px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={applyCustom}
            className="px-3 py-1.5 text-sm rounded bg-gold text-maroon-dark font-medium hover:bg-gold/90"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
