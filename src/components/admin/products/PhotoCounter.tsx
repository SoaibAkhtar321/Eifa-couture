import { PRODUCT_IMAGE_HINT } from '@/lib/admin/validation';

/** "2 of 3 minimum" counter plus a hint on what to photograph. */
export default function PhotoCounter({ count, minimum }: { count: number; minimum: number }) {
  const met = count >= minimum;
  return (
    <div className="space-y-0.5" aria-live="polite">
      <p className={`text-sm font-medium ${met ? 'text-green-700' : 'text-amber-700'}`}>
        {met ? '✓ ' : ''}
        {count} of {minimum} minimum
      </p>
      {!met && <p className="text-xs text-ink-muted">{PRODUCT_IMAGE_HINT}</p>}
    </div>
  );
}
