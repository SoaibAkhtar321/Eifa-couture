'use client';

/* ============================================
   EIFA COUTURE — The ONE product card
   ============================================
   Used by every product surface: homepage rails, audience sections,
   shop, related products and wishlist. Do not create another card.
   ============================================ */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSyncExternalStore } from 'react';

import { HOVER_LIFT } from '@/components/motion/presets';
import ProductImage from '@/components/ui/ProductImage';
import {
  formatPrice,
  getCategoryPlaceholder,
  getDiscountPercentage,
  isInStock,
  resolveVariantPrice,
} from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';
import { useUIStore } from '@/store/ui-store';
import { useWishlistStore } from '@/store/wishlist-store';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  /** Load the first image eagerly (above-the-fold cards only). */
  priority?: boolean;
  /** Remember the scroll position so the shop list restores on Back. */
  saveShopScroll?: boolean;
}

const subscribeToHydration = () => () => {};

function useHasHydrated() {
  return useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false
  );
}

function resolveImage(src: string | undefined, category: string) {
  if (!src || src.includes('picsum.photos')) return getCategoryPlaceholder(category);
  return src;
}

export default function ProductCard({ product, priority = false, saveShopScroll = false }: ProductCardProps) {
  const router = useRouter();
  const hasHydrated = useHasHydrated();

  const addItem = useCartStore((state) => state.addItem);
  const openCart = useUIStore((state) => state.openCart);
  const toggleWishlist = useWishlistStore((state) => state.toggleItem);
  const inWishlist = useWishlistStore((state) => state.isInWishlist(product.id));
  const wished = hasHydrated && inWishlist;

  const href = `/product/${product.slug}`;
  const image = resolveImage(product.images?.[0], product.category);
  const hoverImage = product.images?.[1] ? resolveImage(product.images[1], product.category) : null;

  const price = product.minPrice;
  const discount = product.compareAtPrice ? getDiscountPercentage(product.compareAtPrice, price) : 0;

  // A card can only add/buy directly when there is exactly one choice to
  // make. Anything with several sizes or colours sends the shopper to the
  // product page to choose, so we never add a size they did not pick.
  const size = product.sizes[0];
  const color = product.colors[0]?.name;
  const singleChoice =
    !!size && !!color && product.sizes.length <= 1 && product.colors.length <= 1;
  const soldOut = Object.values(product.stock).every((count) => count <= 0);
  const stock = singleChoice ? product.stock[`${size}-${color}`] ?? 0 : 0;
  const canAct = singleChoice && isInStock(product.stock, size, color);

  const rememberScroll = () => {
    if (!saveShopScroll || typeof window === 'undefined') return;
    sessionStorage.setItem('eifa-shop-scroll-y', String(window.scrollY));
    sessionStorage.setItem('eifa-restore-shop-scroll', 'true');
  };

  const handleAddToCart = () => {
    if (!canAct) return;
    addItem(product, size, color, 1, stock, resolveVariantPrice(product, size, color));
    openCart();
  };

  const handleBuyNow = () => {
    if (!canAct) return;
    const item = { product, size, color, quantity: 1, unitPrice: resolveVariantPrice(product, size, color) };
    sessionStorage.setItem('eifa-buy-now', JSON.stringify(item));
    router.push('/checkout?mode=buy-now');
  };

  return (
    <div
      className={`group flex h-full w-full flex-col overflow-hidden rounded-lg bg-white md:rounded-xl ring-1 ring-gold-deep/20 ${HOVER_LIFT}`}
    >
      <div className="relative aspect-[5/6] overflow-hidden bg-beige md:aspect-[4/5]">
        <Link href={href} onClick={rememberScroll} aria-label={`View ${product.name}`} className="absolute inset-0 block">
          <ProductImage
            src={image}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 46vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none"
          />
          {hoverImage && (
            <ProductImage
              src={hoverImage}
              alt=""
              fill
              sizes="25vw"
              className="hidden object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 md:block motion-reduce:transition-none"
            />
          )}
        </Link>

        <div className="pointer-events-none absolute left-1.5 top-1.5 flex flex-col items-start gap-1 md:left-3 md:top-3 md:gap-1.5">
          {product.isNewArrival && (
            <span className="bg-gold px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-espresso md:px-2 md:py-1 md:text-[10px] md:tracking-[0.14em]">
              New
            </span>
          )}
          {discount > 0 && (
            <span className="bg-maroon px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-white md:px-2 md:py-1 md:text-[10px] md:tracking-[0.14em]">
              Sale
            </span>
          )}
          {soldOut && (
            <span className="bg-espresso px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-white md:px-2 md:py-1 md:text-[10px] md:tracking-[0.14em]">
              Sold out
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          aria-pressed={wished}
          aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          className="tap-feedback absolute right-0 top-0 flex h-10 w-10 items-center justify-center md:right-1.5 md:top-1.5 md:h-11 md:w-11"
        >
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full text-sm shadow-sm md:h-9 md:w-9 md:text-base transition-colors ${
              wished ? 'bg-maroon text-white' : 'bg-ivory/95 text-maroon hover:bg-maroon hover:text-white'
            }`}
            aria-hidden="true"
          >
            {wished ? '♥' : '♡'}
          </span>
        </button>
      </div>

      <div className="flex flex-1 flex-col px-2 pb-2 pt-2 md:px-4 md:pb-4 md:pt-3">
        {product.fabric && (
          <p className="mb-1 hidden text-[10px] font-medium uppercase tracking-[0.16em] text-gold-deep md:block md:text-[11px]">
            {product.fabric}
          </p>
        )}
        <Link href={href} onClick={rememberScroll} className="group/title">
          <h3 className="line-clamp-2 font-heading text-[13px] leading-tight md:leading-snug text-ink transition-colors group-hover/title:text-maroon md:text-lg">
            {product.name}
          </h3>
        </Link>

        <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0 md:mt-2 md:gap-x-2 md:gap-y-0.5">
          <span className="font-subheading text-sm font-semibold text-ink md:text-xl">
            {product.hasPriceRange ? `From ${formatPrice(price)}` : formatPrice(price)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > price && (
            <span className="text-[11px] text-ink-muted line-through md:text-sm">{formatPrice(product.compareAtPrice)}</span>
          )}
          {discount > 0 && <span className="text-[11px] font-semibold text-maroon md:text-sm">{discount}% OFF</span>}
        </div>

        <div className="mt-auto pt-2 md:pt-3">
          {soldOut ? (
            <span className="flex min-h-9 items-center justify-center rounded-full bg-beige text-[10px] md:min-h-11 md:text-[11px] font-semibold uppercase tracking-[0.14em] text-ink">
              Sold out
            </span>
          ) : singleChoice ? (
            <div className="grid grid-cols-2 gap-1.5 md:gap-2">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!canAct}
                className="tap-feedback min-h-9 rounded-full bg-espresso px-1 md:min-h-11 md:px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-maroon disabled:opacity-60 md:text-[11px]"
              >
                Add to Cart
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!canAct}
                className="tap-feedback min-h-9 rounded-full bg-gold px-1 md:min-h-11 md:px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-espresso transition-colors hover:bg-gold-light disabled:opacity-60 md:text-[11px]"
              >
                Buy Now
              </button>
            </div>
          ) : (
            <Link
              href={href}
              onClick={rememberScroll}
              className="tap-feedback flex min-h-9 items-center justify-center rounded-full bg-espresso px-3 text-[10px] md:min-h-11 md:text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-maroon"
            >
              Choose Options
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
