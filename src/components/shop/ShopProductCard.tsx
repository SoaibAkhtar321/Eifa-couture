'use client';

import { useSyncExternalStore } from 'react';

import Link from 'next/link';
import { motion } from 'framer-motion';

import ProductImage from '@/components/ui/ProductImage';
import { useCartStore } from '@/store/cart-store';
import { useUIStore } from '@/store/ui-store';
import { useWishlistStore } from '@/store/wishlist-store';

import { formatPrice, getDiscountPercentage, resolveVariantPrice } from '@/lib/utils';

import type { Product } from '@/types';

interface ShopProductCardProps {
  product: Product;
  index: number;
}

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  'womens-kurtas': '/images/categories/kurtas.png',
  'mens-kurtas': '/images/categories/men-kurtas.png',
  anarkalis: '/images/categories/anarkali.png',
  dupattas: '/images/categories/dupattas.png',
  sarees: '/images/categories/sarees.png',
  'palazzo-sets': '/images/categories/palazzo.png',
  'bridal-collection': '/images/categories/bridal.png',
  accessories: '/images/categories/dupattas.png',
  'crochet-bags': '/images/categories/dupattas.png',
};

const DEFAULT_PRODUCT_IMAGE = '/images/categories/kurtas.png';
const subscribeToHydration = () => () => {};

function useHasHydrated() {
  return useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false
  );
}

function getProductImage(product: Product) {
  const image = product.images?.[0];

  if (!image || image.includes('picsum.photos')) {
    return CATEGORY_FALLBACK_IMAGES[product.category] || DEFAULT_PRODUCT_IMAGE;
  }

  return image;
}

export default function ShopProductCard({
  product,
  index,
}: ShopProductCardProps) {
  const hasHydrated = useHasHydrated();

  const addItem = useCartStore((state) => state.addItem);
  const openCart = useUIStore((state) => state.openCart);

  const toggleWishlist = useWishlistStore((state) => state.toggleItem);
  const isInWishlist = useWishlistStore((state) =>
    state.isInWishlist(product.id)
  );

  const visibleIsInWishlist = hasHydrated ? isInWishlist : false;
  const productImage = getProductImage(product);

  const cardPrice = product.minPrice;
  const discount = product.compareAtPrice
    ? getDiscountPercentage(product.compareAtPrice, cardPrice)
    : 0;

  const saveShopScrollPosition = () => {
    if (typeof window === 'undefined') return;

    sessionStorage.setItem('eifa-shop-scroll-y', String(window.scrollY));
    sessionStorage.setItem('eifa-restore-shop-scroll', 'true');
  };

  const handleAddToCart = () => {
    const defaultSize = product.sizes[0];
    const defaultColor = product.colors[0]?.name;

    if (!defaultSize || !defaultColor) return;

    const unitPrice = resolveVariantPrice(product, defaultSize, defaultColor);
    addItem(product, defaultSize, defaultColor, 1, undefined, unitPrice);
    openCart();
  };

  const handleWishlistClick = () => {
    toggleWishlist(product.id);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        duration: 0.6,
        delay: Math.min(index * 0.06, 0.3),
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="group"
    >
      <div className="relative overflow-hidden bg-cream">
        <Link
          href={`/product/${product.slug}`}
          scroll={true}
          onClick={saveShopScrollPosition}
          aria-label={`View ${product.name}`}
          className="block"
        >
          <div className="relative aspect-[3/4] overflow-hidden">
            <ProductImage
              src={productImage}
              alt={product.name}
              fill
              priority={index < 2}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/25 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </div>
        </Link>

        <div className="absolute left-2 top-2 flex flex-col gap-1.5 sm:left-3 sm:top-3 sm:gap-2">
          {product.isNewArrival && (
            <span className="bg-ivory/95 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.18em] text-maroon shadow-sm sm:px-3 sm:py-1 sm:text-[10px] sm:tracking-[0.24em]">
              New
            </span>
          )}

          {discount > 0 && (
            <span className="bg-maroon px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.18em] text-white shadow-sm sm:px-3 sm:py-1 sm:text-[10px] sm:tracking-[0.22em]">
              {discount}% Off
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleWishlistClick}
          aria-label={
            visibleIsInWishlist
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          className="tap-feedback absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-ivory/95 text-sm text-maroon shadow-sm hover:bg-maroon hover:text-white focus-visible:bg-maroon focus-visible:text-white sm:right-3 sm:top-3 sm:h-9 sm:w-9"
        >
          {visibleIsInWishlist ? '♥' : '♡'}
        </button>

        {/* Quick add-to-bag: a compact icon button on touch/mobile
            (hover reveal doesn't work on touch devices), and the full
            reveal-on-hover bar on larger pointer-driven screens. */}
        <button
          type="button"
          onClick={handleAddToCart}
          aria-label={`Add ${product.name} to bag`}
          className="tap-feedback absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-charcoal text-white shadow-sm hover:bg-maroon focus-visible:bg-maroon sm:hidden"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        </button>

        <button
          type="button"
          onClick={handleAddToCart}
          className="tap-feedback absolute inset-x-4 bottom-4 hidden translate-y-4 bg-charcoal px-5 py-3 text-[11px] font-medium uppercase tracking-[0.22em] text-white opacity-0 transition-all duration-500 hover:bg-maroon group-hover:translate-y-0 group-hover:opacity-100 sm:block"
        >
          Add to Bag
        </button>
      </div>

      <div className="pt-2 sm:pt-4">
        <p className="mb-0.5 text-[9px] font-medium uppercase tracking-[0.18em] text-gold-dark sm:mb-1 sm:text-[10px] sm:tracking-[0.24em]">
          {product.fabric}
        </p>

        <Link
          href={`/product/${product.slug}`}
          scroll={true}
          onClick={saveShopScrollPosition}
          className="group/title"
        >
          <h3 className="product-card-title line-clamp-2 font-heading text-charcoal transition-colors duration-300 group-hover/title:text-maroon">
            {product.name}
          </h3>
        </Link>

        <p className="mt-1 line-clamp-2 hidden text-sm leading-6 text-charcoal/60 sm:mt-2 sm:block">
          {product.shortDescription}
        </p>

        <div className="mt-1.5 flex flex-wrap items-center gap-2 sm:mt-3 sm:gap-3">
          <span className="text-xs font-medium text-charcoal sm:text-sm">
            {product.hasPriceRange ? `From ${formatPrice(cardPrice)}` : formatPrice(cardPrice)}
          </span>

          {product.compareAtPrice && (
            <span className="text-[11px] text-charcoal/40 line-through sm:text-xs">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>

        <div className="mt-1.5 flex items-center gap-1.5 sm:mt-3">
          {product.colors.slice(0, 4).map((color) => (
            <span
              key={color.name}
              title={color.name}
              className="h-3.5 w-3.5 rounded-full border border-charcoal/10 shadow-sm sm:h-4 sm:w-4"
              style={{ backgroundColor: color.hex }}
            />
          ))}

          {product.colors.length > 4 && (
            <span className="text-[10px] uppercase tracking-[0.16em] text-charcoal/45">
              +{product.colors.length - 4}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}
