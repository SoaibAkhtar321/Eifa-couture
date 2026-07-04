'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

import { formatPrice, getDiscountPercentage, isInStock } from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';
import { useUIStore } from '@/store/ui-store';
import { useWishlistStore } from '@/store/wishlist-store';
import type { Product } from '@/types';

interface ProductInfoProps {
  product: Product;
}

const subscribeToHydration = () => () => {};

function useHasHydrated() {
  return useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false
  );
}

export default function ProductInfo({ product }: ProductInfoProps) {
  const router = useRouter();

  const hasHydrated = useHasHydrated();
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] ?? '');
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.name ?? '');
  const [quantity, setQuantity] = useState(1);

  const addItem = useCartStore((state) => state.addItem);
  const openCart = useUIStore((state) => state.openCart);
  const toggleWishlist = useWishlistStore((state) => state.toggleItem);
  const isInWishlist = useWishlistStore((state) => state.isInWishlist(product.id));

  const discount = product.compareAtPrice
    ? getDiscountPercentage(product.compareAtPrice, product.price)
    : 0;

  const selectedStock = useMemo(() => {
    if (!selectedSize || !selectedColor) return 0;
    return product.stock[`${selectedSize}-${selectedColor}`] ?? 0;
  }, [product.stock, selectedColor, selectedSize]);

  const hasStock = isInStock(product.stock, selectedSize, selectedColor);
  const maxQuantity = Math.min(selectedStock, 5);

  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    setQuantity(1);
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    setQuantity(1);
  };

  const handleAddToCart = () => {
    if (!hasStock) return;
    addItem(product, selectedSize, selectedColor, quantity);
    openCart();
  };

  const handleBuyNow = () => {
    if (!hasStock) return;
    const buyNowItem = { product, size: selectedSize, color: selectedColor, quantity };
    sessionStorage.setItem('eifa-buy-now', JSON.stringify(buyNowItem));
    router.push('/checkout?mode=buy-now');
  };

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

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <span className="font-subheading text-3xl text-maroon">{formatPrice(product.price)}</span>
        {product.compareAtPrice && (
          <span className="text-base text-charcoal/40 line-through">{formatPrice(product.compareAtPrice)}</span>
        )}
        {discount > 0 && (
          <span className="bg-maroon px-2 py-1 text-[9px] font-medium uppercase tracking-[0.2em] text-white">
            {discount}% Off
          </span>
        )}
      </div>

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
          <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.24em] text-charcoal/70">Quantity</p>
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

      <div className="mt-8 flex flex-col gap-3">
        <div className="flex w-full items-center gap-3">
          <button type="button" onClick={handleAddToCart} disabled={!hasStock} className="btn-luxury btn-luxury-primary flex-1 min-h-[52px] text-[11px] disabled:opacity-50">
            {hasStock ? 'Add to Bag' : 'Out of Stock'}
          </button>
          <button
            type="button"
            onClick={() => toggleWishlist(product.id)}
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
      
      {/* Accordions removed for brevity in snippet; they remain unchanged in your code */}
    </motion.div>
  );
}
