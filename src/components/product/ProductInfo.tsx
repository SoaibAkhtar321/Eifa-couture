'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

import MobileStickyActionBar from '@/components/product/MobileStickyActionBar';
import { useAuth } from '@/hooks/useAuth';
import { useMediaQuery, usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import {
  findVariant,
  formatPrice,
  getDiscountPercentage,
  isInStock,
  resolveVariantPrice,
} from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';
import { useUIStore } from '@/store/ui-store';
import { useWishlistStore } from '@/store/wishlist-store';
import type { Product } from '@/types';

interface ProductInfoProps {
  product: Product;
  /** Called with the selected color whenever it changes, including
   *  once on mount with the default selection — lets a sibling (the
   *  image gallery) switch to that color's photos without lifting all
   *  of this component's selection state. */
  onColorChange?: (color: string) => void;
}

/* ============================================
   Auth-gated shopping actions
   ============================================
   Guests can browse freely, but Add to Bag / Buy Now / Wishlist all
   require a session. When a guest triggers one of these, we stash
   what they were trying to do here, send them to /login with a
   redirect back to this exact product page, and replay the action
   once they return authenticated — no popup, no modal, no lost intent.

   Kept local to this file since it's the only consumer today;
   promote to src/types if a second consumer (reviews, orders) shows
   up later.
   ============================================ */
type PendingAuthAction =
  | { type: 'addToBag'; productId: string; size: string; color: string; quantity: number }
  | { type: 'buyNow'; productId: string; size: string; color: string; quantity: number }
  | { type: 'toggleWishlist'; productId: string };

const PENDING_ACTION_KEY = 'eifa-pending-action';

// Show "Only X left" messaging once selected-variant stock drops to
// this number or below. Adjust freely — purely a display threshold,
// doesn't affect cart/quantity clamping logic elsewhere.
const LOW_STOCK_THRESHOLD = 5;

const subscribeToHydration = () => () => {};

function useHasHydrated() {
  return useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false
  );
}

/* ============================================
   Product details accordion
   ============================================
   Description pulls from the product itself (falls back to the
   short description already used above the size/colour selectors
   if a longer `description` field isn't present on the type).
   Shipping & Care are standard boilerplate — swap the copy below if
   you want it to vary per-product later.
   ============================================ */
type AccordionSection = {
  id: string;
  title: string;
  content: string;
};

function ProductAccordion({ product }: { product: Product }) {
  const [openId, setOpenId] = useState<string | null>('description');

  // description and care both come straight off the Product type — no
  // fallback needed, every product record has them.
  const careCopy = product.care.join(' ');

  const sections: AccordionSection[] = [
    {
      id: 'description',
      title: 'Description',
      content: product.description,
    },
    {
      id: 'shipping',
      title: 'Shipping & Returns',
      content:
        'Ships within 3–5 business days across India, with express options available at checkout. International shipping is available to select countries. Returns are accepted within 7 days of delivery for unworn, unwashed items with tags intact — please see our full returns policy for details.',
    },
    {
      id: 'care',
      title: 'Care Instructions',
      content: careCopy,
    },
  ];

  const toggleSection = (id: string) => {
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <div className="mt-8 border-t border-beige">
      {sections.map((section) => {
        const isOpen = openId === section.id;
        return (
          <div key={section.id} className="border-b border-beige">
            <button
              type="button"
              onClick={() => toggleSection(section.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between py-5 text-left transition-colors duration-300 hover:text-maroon"
            >
              <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-charcoal">
                {section.title}
              </span>
              <span
                className={`text-lg text-charcoal/60 transition-transform duration-300 ${
                  isOpen ? 'rotate-45' : 'rotate-0'
                }`}
              >
                +
              </span>
            </button>
            <div
              className={`grid overflow-hidden transition-all duration-300 ease-in-out ${
                isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <p className="pb-5 text-sm leading-7 text-charcoal/65">{section.content}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ProductInfo({ product, onColorChange }: ProductInfoProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  const hasHydrated = useHasHydrated();
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] ?? '');
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.name ?? '');
  const [quantity, setQuantity] = useState(1);

  // Tracks whether the shopper has actively picked a size or colour
  // yet. Sizes/colours default to the first available option so the
  // rest of the component always has a usable selection, but the
  // *price display* should still read "From ₹X" until the shopper has
  // made a real choice — this flag is what gates that.
  const [hasInteracted, setHasInteracted] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const openCart = useUIStore((state) => state.openCart);
  const toggleWishlist = useWishlistStore((state) => state.toggleItem);
  const isInWishlist = useWishlistStore((state) => state.isInWishlist(product.id));

  // Guards the replay effect so a pending action only ever fires once,
  // even if isAuthenticated flips more than once during hydration.
  const hasReplayedRef = useRef(false);

  /* ============================================
     Mobile sticky CTA visibility
     ============================================
     Watches the primary Add to Bag / Buy Now block via
     IntersectionObserver. The sticky bar appears only once that block
     has scrolled out of view, and only on mobile/tablet — it reuses
     handleAddToCart / handleBuyNow / handleToggleWishlist below rather
     than any logic of its own.
     ============================================ */
  const primaryCtaRef = useRef<HTMLDivElement>(null);
  const [isPrimaryCTAVisible, setIsPrimaryCTAVisible] = useState(true);
  const isMobileOrTablet = useMediaQuery('(max-width: 1023px)');
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const node = primaryCtaRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsPrimaryCTAVisible(entry.isIntersecting),
      { rootMargin: '0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const showStickyBar = hasHydrated && isMobileOrTablet && !isPrimaryCTAVisible;

  // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once
  // for the initial default color; later changes go through
  // handleColorChange below instead of re-running this effect.
  useEffect(() => {
    if (selectedColor) onColorChange?.(selectedColor);
  }, []);

  /* ============================================
     Variant-aware pricing
     ============================================
     Before the shopper has picked a size/colour, a product whose
     variants carry different prices shows "From ₹{lowest}". The
     instant both are selected (or immediately, for single-price
     products), price/MRP/discount/savings/stock all resolve from the
     matched `product_variants` row via `price_override` — never from
     the base `product.price`. The price node itself never changes
     structure between these two states, only its text, so there's no
     layout shift.
     ============================================ */
  const selectedVariant = useMemo(
    () => findVariant(product, selectedSize, selectedColor),
    [product, selectedSize, selectedColor]
  );

  const showFromPrice = product.hasPriceRange && !hasInteracted;

  const currentPrice = showFromPrice
    ? product.minPrice
    : selectedVariant?.price ?? product.minPrice;

  const discount =
    !showFromPrice && product.compareAtPrice
      ? getDiscountPercentage(product.compareAtPrice, currentPrice)
      : 0;

  const savings =
    !showFromPrice && product.compareAtPrice
      ? Math.max(product.compareAtPrice - currentPrice, 0)
      : 0;

  const priceLabel = showFromPrice
    ? `From ${formatPrice(currentPrice)}`
    : formatPrice(currentPrice);

  const selectedStock = useMemo(() => {
    if (!selectedSize || !selectedColor) return 0;
    return product.stock[`${selectedSize}-${selectedColor}`] ?? 0;
  }, [product.stock, selectedColor, selectedSize]);

  const hasStock = isInStock(product.stock, selectedSize, selectedColor);
  // True only if every size/color combination is at zero — distinct
  // from `hasStock`, which is scoped to the currently selected variant.
  const isFullySoldOut = useMemo(
    () => Object.values(product.stock).every((count) => count <= 0),
    [product.stock]
  );
  // Bound purely by real stock now — the old flat "5" ceiling was
  // arbitrary and disagreed with the cart store's own 10-unit cap.
  const maxQuantity = selectedStock;

  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    setQuantity(1);
    setHasInteracted(true);
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    setQuantity(1);
    setHasInteracted(true);
    onColorChange?.(color);
  };

  const savePendingActionAndRedirect = (action: PendingAuthAction) => {
    sessionStorage.setItem(PENDING_ACTION_KEY, JSON.stringify(action));
    router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
  };

  const handleAddToCart = () => {
    if (!hasStock) return;

    if (!isAuthenticated) {
      savePendingActionAndRedirect({
        type: 'addToBag',
        productId: product.id,
        size: selectedSize,
        color: selectedColor,
        quantity,
      });
      return;
    }

    const unitPrice = resolveVariantPrice(product, selectedSize, selectedColor);
    addItem(product, selectedSize, selectedColor, quantity, selectedStock, unitPrice);
    openCart();
  };

  const handleBuyNow = () => {
    if (!hasStock) return;

    if (!isAuthenticated) {
      savePendingActionAndRedirect({
        type: 'buyNow',
        productId: product.id,
        size: selectedSize,
        color: selectedColor,
        quantity,
      });
      return;
    }

    const unitPrice = resolveVariantPrice(product, selectedSize, selectedColor);
    const buyNowItem = { product, size: selectedSize, color: selectedColor, quantity, unitPrice };
    sessionStorage.setItem('eifa-buy-now', JSON.stringify(buyNowItem));
    router.push('/checkout?mode=buy-now');
  };

  const handleToggleWishlist = () => {
    if (!isAuthenticated) {
      savePendingActionAndRedirect({
        type: 'toggleWishlist',
        productId: product.id,
      });
      return;
    }

    toggleWishlist(product.id);
  };

  // Replays a pending action after the guest returns authenticated.
  // Depends on isAuthenticated (not just mount) so it fires correctly
  // once the session actually resolves, rather than racing hydration.
  useEffect(() => {
    if (!isAuthenticated || hasReplayedRef.current) return;

    const raw = sessionStorage.getItem(PENDING_ACTION_KEY);
    if (!raw) return;

    hasReplayedRef.current = true;
    sessionStorage.removeItem(PENDING_ACTION_KEY);

    let action: PendingAuthAction;
    try {
      action = JSON.parse(raw);
    } catch {
      return; // Malformed payload — ignore silently.
    }

    // Only replay if this is the product page the action was created
    // on; the login redirect already targets this exact page, but this
    // guards against stale/cross-product sessionStorage state.
    if (action.productId !== product.id) return;

    if (action.type === 'addToBag') {
      // Use stock for the replayed action's own size/color, not the
      // component's current selection state — they can differ if the
      // guest's selection changed before their pending action fires.
      const actionStock = product.stock[`${action.size}-${action.color}`] ?? 0;
      // Re-check stock at replay time: if this variant sold out between
      // the guest's original click and them completing login, silently
      // drop the action instead of adding a 0-quantity line to the cart
      // (clampQuantity would otherwise floor it to 0, same as the
      // interactive handler's own `if (!hasStock) return` guard).
      if (actionStock <= 0) return;
      const actionUnitPrice = resolveVariantPrice(product, action.size, action.color);
      addItem(product, action.size, action.color, action.quantity, actionStock, actionUnitPrice);
      openCart();
    } else if (action.type === 'buyNow') {
      const actionStock = product.stock[`${action.size}-${action.color}`] ?? 0;
      // Same guard as addToBag above — don't send an out-of-stock item
      // straight to checkout; the checkout page doesn't re-validate stock.
      if (actionStock <= 0) return;
      const actionUnitPrice = resolveVariantPrice(product, action.size, action.color);
      const buyNowItem = {
        product,
        size: action.size,
        color: action.color,
        quantity: action.quantity,
        unitPrice: actionUnitPrice,
      };
      sessionStorage.setItem('eifa-buy-now', JSON.stringify(buyNowItem));
      router.push('/checkout?mode=buy-now');
    } else if (action.type === 'toggleWishlist') {
      toggleWishlist(action.productId);
    }
  }, [isAuthenticated, product, addItem, openCart, router, toggleWishlist]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="lg:sticky lg:top-32 lg:self-start"
    >
      <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold-dark">{product.fabric}</p>

      <h1 className="mt-3 font-heading text-4xl leading-tight text-charcoal sm:text-5xl lg:text-6xl">
        {product.name}
      </h1>

      {isFullySoldOut && (
        <p className="mt-3 inline-block bg-charcoal px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-white">
          Currently Sold Out — All Sizes &amp; Colours
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <span className="font-subheading text-3xl text-maroon">{priceLabel}</span>
        {!showFromPrice && product.compareAtPrice && (
          <span className="text-base text-charcoal/40 line-through">{formatPrice(product.compareAtPrice)}</span>
        )}
        {!showFromPrice && discount > 0 && (
          <span className="bg-maroon px-2 py-1 text-[9px] font-medium uppercase tracking-[0.2em] text-white">
            {discount}% Off
          </span>
        )}
      </div>

      {!showFromPrice && savings > 0 && (
        <p className="mt-2 text-xs font-medium text-charcoal/55">
          You save {formatPrice(savings)}
        </p>
      )}

      <p className="mt-5 text-sm leading-7 text-charcoal/65">{product.shortDescription}</p>

      <div className="mt-8 border-y border-beige py-7">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-charcoal/70">Select Size</p>
            <button type="button" className="text-[10px] uppercase tracking-wider text-charcoal/50 underline underline-offset-4 transition-colors duration-300 hover:text-maroon">
              Size Guide
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => {
              const sizeHasStock = isInStock(product.stock, size, selectedColor || product.colors[0]?.name || '');
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleSizeChange(size)}
                  disabled={!sizeHasStock}
                  className={`min-h-[44px] min-w-[52px] border px-4 py-2 text-xs transition-all duration-300 ${
                    selectedSize === size ? 'border-maroon bg-maroon text-white' : 'border-beige bg-white text-charcoal hover:border-gold'
                  } ${!sizeHasStock ? 'cursor-not-allowed opacity-40' : ''}`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-7">
          <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.24em] text-charcoal/70">
            Colour: <span className="text-maroon ml-1">{selectedColor}</span>
          </p>
          <div className="flex flex-wrap gap-3">
            {product.colors.map((color) => {
              const colorHasStock = isInStock(product.stock, selectedSize, color.name);
              return (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => handleColorChange(color.name)}
                  disabled={!colorHasStock}
                  className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300 ${
                    selectedColor === color.name ? 'border-maroon' : 'border-beige hover:border-gold'
                  } ${!colorHasStock ? 'cursor-not-allowed opacity-40' : ''}`}
                >
                  <span className="h-8 w-8 rounded-full border border-charcoal/10" style={{ backgroundColor: color.hex }} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-7">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-charcoal/70">Quantity</p>
            {hasStock && selectedStock <= LOW_STOCK_THRESHOLD && (
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-maroon">
                Only {selectedStock} left
              </p>
            )}
          </div>
          <div className="flex h-12 w-32 items-center justify-between border border-beige bg-white">
            <button type="button" onClick={() => setQuantity((c) => Math.max(1, c - 1))} disabled={quantity <= 1} className="h-full w-10 text-xl text-charcoal/70 transition-colors duration-300 hover:text-maroon disabled:opacity-30">
              −
            </button>
            <span className="text-sm font-medium text-charcoal">{quantity}</span>
            <button type="button" onClick={() => setQuantity((c) => Math.min(maxQuantity, c + 1))} disabled={quantity >= maxQuantity || !hasStock} className="h-full w-10 text-xl text-charcoal/70 transition-colors duration-300 hover:text-maroon disabled:opacity-30">
              +
            </button>
          </div>
        </div>
      </div>

      <div ref={primaryCtaRef} className="mt-8 flex flex-col gap-3">
        <div className="flex w-full items-center gap-3">
          <button type="button" onClick={handleAddToCart} disabled={!hasStock} className="btn-luxury btn-luxury-primary flex-1 min-h-[52px] text-[11px] disabled:opacity-50">
            {hasStock ? 'Add to Bag' : 'Out of Stock'}
          </button>
          <button
            type="button"
            onClick={handleToggleWishlist}
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center border border-beige bg-white text-charcoal transition-all duration-300 hover:border-maroon hover:text-maroon"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={hasHydrated && isInWishlist ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={hasHydrated && isInWishlist ? 'text-maroon' : ''}
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={!hasStock}
          className="btn-luxury min-h-[52px] w-full border border-gold bg-gold text-[11px] font-medium uppercase tracking-[0.2em] text-charcoal transition-all duration-300 hover:border-maroon hover:bg-maroon hover:text-white disabled:opacity-50"
        >
          Buy It Now
        </button>
      </div>

      <ProductAccordion product={product} />

      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            className="fixed inset-x-0 bottom-0 z-(--z-sticky-cta) lg:hidden"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
            }
          >
            <MobileStickyActionBar
              imageUrl={product.images?.[0]}
              productName={product.name}
              priceLabel={priceLabel}
              hasStock={hasStock}
              onAddToBag={handleAddToCart}
              onBuyNow={handleBuyNow}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
