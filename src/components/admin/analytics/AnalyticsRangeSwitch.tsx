'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { cn } from '@/lib/utils';
import { ANALYTICS_RANGE_OPTIONS, type AnalyticsRange } from '@/lib/admin/analytics-range';

interface AnalyticsRangeSwitchProps {
  active: AnalyticsRange;
}

export default function AnalyticsRangeSwitch({ active }: AnalyticsRangeSwitchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: AnalyticsRange) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('range', String(value));
    router.push(`/admin/analytics?${params.toString()}`);
  }

  return (
    <div className="inline-flex rounded-md border border-charcoal/10 bg-ivory p-1">
      {ANALYTICS_RANGE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => handleChange(option.value)}
          className={cn(
            'px-3 py-1.5 text-sm rounded transition-colors',
            active === option.value ? 'bg-maroon text-cream' : 'text-charcoal/60 hover:text-maroon'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
