'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { useCartStore } from '@/store/cart-store';
import { useUIStore } from '@/store/ui-store';
import { useWishlistStore } from '@/store/wishlist-store';

import { formatPrice, getDiscountPercentage } from '@/lib/utils';

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
  const [hasMounted, setHasMounted] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const openCart = useUIStore((state) => state.openCart);

  const toggleWishlist = useWishlistStore((state) => state.toggleItem);
  const isInWishlist = useWishlistStore((state) =>
    state.isInWishlist(product.id)
  );

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const visibleIsInWishlist = hasMounted ? isInWishlist : false;
  const productImage = getProductImage(product);

  const discount = product.compareAtPrice
    ? getDiscountPercentage(product.compareAtPrice, product.price)
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

    addItem(product, defaultSize, defaultColor, 1);
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
            <Image
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

        <div className="absolute left-3 top-3 flex flex-col gap-2">
          {product.isNewArrival && (
            <span className="bg-ivory/95 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.24em] text-maroon shadow-sm">
              New
            </span>
          )}

          {discount > 0 && (
            <span className="bg-maroon px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-white shadow-sm">
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
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-ivory/95 text-sm text-maroon shadow-sm transition-all duration-300 hover:bg-maroon hover:text-white"
        >
          {visibleIsInWishlist ? '♥' : '♡'}
        </button>

        <button
          type="button"
          onClick={handleAddToCart}
          className="absolute inset-x-4 bottom-4 translate-y-4 bg-charcoal px-5 py-3 text-[11px] font-medium uppercase tracking-[0.22em] text-white opacity-0 transition-all duration-500 hover:bg-maroon group-hover:translate-y-0 group-hover:opacity-100"
        >
          Add to Bag
        </button>
      </div>

      <div className="pt-4">
        <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.24em] text-gold-dark">
          {product.fabric}
        </p>

        <Link
          href={`/product/${product.slug}`}
          scroll={true}
          onClick={saveShopScrollPosition}
          className="group/title"
        >
          <h3 className="font-heading text-lg leading-snug text-charcoal transition-colors duration-300 group-hover/title:text-maroon sm:text-xl">
            {product.name}
          </h3>
        </Link>

        <p className="mt-2 line-clamp-2 text-sm leading-6 text-charcoal/60">
          {product.shortDescription}
        </p>

        <div className="mt-3 flex items-center gap-3">
          <span className="text-sm font-medium text-charcoal">
            {formatPrice(product.price)}
          </span>

          {product.compareAtPrice && (
            <span className="text-xs text-charcoal/40 line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center gap-1.5">
          {product.colors.slice(0, 4).map((color) => (
            <span
              key={color.name}
              title={color.name}
              className="h-4 w-4 rounded-full border border-charcoal/10 shadow-sm"
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