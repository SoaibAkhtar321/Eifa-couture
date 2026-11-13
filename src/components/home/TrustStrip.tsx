'use client';

import { useShippingConfig } from '@/hooks/useShippingConfig';
import { formatPrice } from '@/lib/utils';

/**
 * Slim trust strip under the hero. The free-shipping amount comes from
 * admin Store Settings (the same value checkout charges against).
 */
export default function TrustStrip() {
  const { freeThreshold } = useShippingConfig();

  const items = [
    freeThreshold === null
      ? { title: 'Pan-India delivery', text: 'Carefully hand-packed' }
      : { title: 'Free shipping', text: `On orders above ${formatPrice(freeThreshold)}` },
    { title: 'Easy returns', text: '7 days on unworn pieces' },
    { title: 'Secure payment', text: 'Powered by Razorpay' },
  ];

  return (
    <section aria-label="Why shop with us" className="border-b border-gold-deep/20 bg-parchment">
      <ul className="luxury-container grid grid-cols-1 divide-y divide-gold-deep/20 py-1 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {items.map((item) => (
          <li key={item.title} className="flex min-h-11 flex-col items-center justify-center px-4 py-3 text-center">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink">{item.title}</span>
            <span className="mt-0.5 text-xs text-ink-soft">{item.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
