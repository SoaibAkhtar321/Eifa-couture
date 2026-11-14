'use client';

/* ============================================
   EIFA COUTURE — Mobile Sticky Action Bar
   ============================================
   Purely presentational. Owns no state and no business logic —
   auth-gating, stock validation, variant validation, and the
   pending-action replay all continue to live in ProductInfo, which
   passes its existing `handleAddToCart` / `handleBuyNow` down as
   `onAddToBag` / `onBuyNow`. This component just renders a compact
   bar and calls whatever it's given.

   Visibility, mount/unmount timing, and animation are controlled by
   the parent (ProductInfo) via AnimatePresence — this component
   itself doesn't decide when it should show.
   ============================================ */

import Image from 'next/image';

import { isSupabaseImageUrl } from '@/lib/utils';

interface MobileStickyActionBarProps {
  imageUrl?: string;
  productName: string;
  priceLabel: string;
  hasStock: boolean;
  onAddToBag: () => void;
  onBuyNow: () => void;
}

export default function MobileStickyActionBar({
  imageUrl,
  productName,
  priceLabel,
  hasStock,
  onAddToBag,
  onBuyNow,
}: MobileStickyActionBarProps) {
  // `.btn-luxury` sets its own (unlayered) padding, which beats Tailwind
  // utilities — so the compact variant is used here instead of `px-*`.
  return (
    <div
      role="region"
      aria-label="Quick purchase actions"
      className="border-t border-beige bg-white/95 px-3 pt-2 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-md"
      style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto flex max-w-xl items-center gap-2">
        {imageUrl && (
          <div className="hidden h-10 w-10 shrink-0 overflow-hidden rounded-sm border border-beige min-[420px]:block">
            <Image
              src={imageUrl}
              alt=""
              width={40}
              height={40}
              unoptimized={isSupabaseImageUrl(imageUrl)}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="hidden truncate text-[10px] font-medium uppercase tracking-[0.1em] text-ink-soft min-[420px]:block">
            {productName}
          </p>
          <p className="truncate font-subheading text-sm leading-tight text-maroon sm:text-base">{priceLabel}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onBuyNow}
            disabled={!hasStock}
            className="btn-luxury btn-luxury-secondary btn-luxury-compact whitespace-nowrap !px-3 !text-[10px] !tracking-[0.08em] disabled:opacity-50"
            style={{ minHeight: 40 }}
          >
            Buy Now
          </button>
          <button
            type="button"
            onClick={onAddToBag}
            disabled={!hasStock}
            className="btn-luxury btn-luxury-primary btn-luxury-compact whitespace-nowrap !px-3 !text-[10px] !tracking-[0.08em] disabled:opacity-50"
            style={{ minHeight: 40 }}
          >
            {hasStock ? 'Add to Bag' : 'Sold Out'}
          </button>
        </div>
      </div>
    </div>
  );
}
