'use client';

import { useEffect, useRef } from 'react';

import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { SIZE_CHART } from '@/lib/constants';

interface SizeChartModalProps {
  open: boolean;
  onClose: () => void;
  audience: 'women' | 'men';
  /** Sizes this product offers; only matching chart rows are shown. */
  sizes: string[];
}

export default function SizeChartModal({ open, onClose, audience, sizes }: SizeChartModalProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const chart = SIZE_CHART[audience];
  const wanted = new Set(sizes.map((size) => size.toUpperCase()));
  const rows = chart.rows.filter((row) => wanted.has(row.size));

  return (
    <div
      className="fixed inset-0 z-(--z-fullscreen) flex items-end justify-center bg-espresso/80 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="size-chart-title"
      onClick={onClose}
    >
      <div
        className="max-h-[88vh] w-full overflow-y-auto rounded-t-2xl bg-ivory p-6 sm:max-w-md sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="size-chart-title" className="font-heading text-2xl text-ink">
            Size guide
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close size guide"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold-deep/40 text-xl text-ink transition-colors hover:bg-ink hover:text-white"
          >
            ×
          </button>
        </div>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          Approximate body measurements in inches. Each piece is hand-finished, so allow about 1 inch of difference.
        </p>

        <table className="mt-5 w-full border-collapse text-left text-sm text-ink">
          <caption className="sr-only">Body measurements by size, in inches</caption>
          <thead>
            <tr className="border-b border-gold-deep/40 text-[11px] uppercase tracking-[0.16em] text-ink-soft">
              <th scope="col" className="py-2 pr-3 font-medium">Size</th>
              <th scope="col" className="py-2 pr-3 font-medium">{chart.measureLabel}</th>
              <th scope="col" className="py-2 font-medium">Waist</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.size} className="border-b border-beige">
                <th scope="row" className="py-3 pr-3 font-medium">{row.size}</th>
                <td className="py-3 pr-3">{row.measure}&quot;</td>
                <td className="py-3">{row.waist}&quot;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
