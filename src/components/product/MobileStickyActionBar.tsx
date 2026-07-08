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
  return (
    <div
      role="region"
      aria-label="Quick purchase actions"
      className="border-t border-beige bg-white/95 px-4 pt-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-md"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto flex max-w-xl items-center gap-3">
        {imageUrl && (
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-sm border border-beige">
            <Image
              src={imageUrl}
              alt=""
              width={44}
              height={44}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium uppercase tracking-[0.12em] text-charcoal/70">
            {productName}
          </p>
          <p className="font-subheading text-base text-maroon">{priceLabel}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onBuyNow}
            disabled={!hasStock}
            className="btn-luxury btn-luxury-secondary min-h-[44px] px-4 text-[10px] disabled:opacity-50"
          >
            Buy Now
          </button>
          <button
            type="button"
            onClick={onAddToBag}
            disabled={!hasStock}
            className="btn-luxury btn-luxury-primary min-h-[44px] px-4 text-[10px] disabled:opacity-50"
          >
            {hasStock ? 'Add to Bag' : 'Sold Out'}
          </button>
        </div>
      </div>
    </div>
  );
}
