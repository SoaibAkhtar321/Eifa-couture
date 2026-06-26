'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

import { formatPrice, getDiscountPercentage, isInStock } from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';
import { useUIStore } from '@/store/ui-store';
import { useWishlistStore } from '@/store/wishlist-store';
import type { Product } from '@/types';

interface ProductInfoProps {
  product: Product;
}

export default function ProductInfo({ product }: ProductInfoProps) {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.7,
        delay: 0.12,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="lg:sticky lg:top-32 lg:self-start"
    >
      <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold-dark">
        {product.fabric}
      </p>

      <h1 className="mt-4 font-heading text-4xl leading-tight text-charcoal sm:text-5xl lg:text-6xl">
        {product.name}
      </h1>

      <p className="mt-5 text-base leading-8 text-charcoal/65">
        {product.shortDescription}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="font-subheading text-3xl text-maroon">
          {formatPrice(product.price)}
        </span>

        {product.compareAtPrice && (
          <span className="text-base text-charcoal/40 line-through">
            {formatPrice(product.compareAtPrice)}
          </span>
        )}

        {discount > 0 && (
          <span className="bg-maroon px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white">
            {discount}% Off
          </span>
        )}
      </div>

      <div className="mt-8 border-y border-beige py-7">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-charcoal">
              Select Size
            </p>
            <button
              type="button"
              className="text-xs text-charcoal/50 underline underline-offset-4 transition-colors duration-300 hover:text-maroon"
            >
              Size Guide
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => {
              const colorForStock = selectedColor || product.colors[0]?.name || '';
              const sizeHasStock = isInStock(product.stock, size, colorForStock);

              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleSizeChange(size)}
                  disabled={!sizeHasStock}
                  className={`min-w-12 border px-4 py-3 text-sm transition-all duration-300 ${
                    selectedSize === size
                      ? 'border-maroon bg-maroon text-white'
                      : 'border-charcoal/15 bg-white text-charcoal hover:border-gold'
                  } ${!sizeHasStock ? 'cursor-not-allowed opacity-40' : ''}`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-7">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-charcoal">
            Colour: <span className="text-maroon">{selectedColor}</span>
          </p>

          <div className="flex flex-wrap gap-3">
            {product.colors.map((color) => {
              const colorHasStock = isInStock(
                product.stock,
                selectedSize,
                color.name
              );

              return (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => handleColorChange(color.name)}
                  disabled={!colorHasStock}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300 ${
                    selectedColor === color.name
                      ? 'border-maroon'
                      : 'border-charcoal/15 hover:border-gold'
                  } ${!colorHasStock ? 'cursor-not-allowed opacity-40' : ''}`}
                  aria-label={`Select ${color.name}`}
                >
                  <span
                    className="h-7 w-7 rounded-full border border-charcoal/10"
                    style={{ backgroundColor: color.hex }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-7">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-charcoal">
            Quantity
          </p>

          <div className="flex w-36 items-center justify-between border border-charcoal/15 bg-white">
            <button
              type="button"
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              disabled={quantity <= 1}
              className="h-12 w-12 text-xl text-charcoal/70 transition-colors duration-300 hover:text-maroon disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Decrease quantity"
            >
              −
            </button>

            <span className="text-sm font-medium text-charcoal">{quantity}</span>

            <button
              type="button"
              onClick={() =>
                setQuantity((current) => Math.min(maxQuantity, current + 1))
              }
              disabled={quantity >= maxQuantity || !hasStock}
              className="h-12 w-12 text-xl text-charcoal/70 transition-colors duration-300 hover:text-maroon disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <p className="mt-3 text-xs text-charcoal/50">
            {hasStock
              ? `${selectedStock} pieces available for selected options`
              : 'Currently unavailable in selected options'}
          </p>
        </div>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_56px]">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!hasStock}
          className="btn-luxury btn-luxury-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {hasStock ? 'Add to Bag' : 'Out of Stock'}
        </button>

        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          className="flex h-14 items-center justify-center border border-charcoal/15 bg-white text-2xl text-maroon transition-all duration-300 hover:border-maroon hover:bg-maroon hover:text-white"
          aria-label={
            isInWishlist
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
        >
          {isInWishlist ? '♥' : '♡'}
        </button>
      </div>

      <div className="mt-8 space-y-5">
        <details className="group border-b border-beige pb-5" open>
          <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-charcoal">
            Product Description
            <span className="text-xl text-maroon transition-transform duration-300 group-open:rotate-45">
              +
            </span>
          </summary>

          <p className="mt-4 whitespace-pre-line text-sm leading-7 text-charcoal/60">
            {product.description}
          </p>
        </details>

        <details className="group border-b border-beige pb-5">
          <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-charcoal">
            Care Instructions
            <span className="text-xl text-maroon transition-transform duration-300 group-open:rotate-45">
              +
            </span>
          </summary>

          <ul className="mt-4 space-y-2 text-sm leading-7 text-charcoal/60">
            {product.care.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </details>

        <details className="group border-b border-beige pb-5">
          <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-charcoal">
            Shipping & Returns
            <span className="text-xl text-maroon transition-transform duration-300 group-open:rotate-45">
              +
            </span>
          </summary>

          <div className="mt-4 space-y-2 text-sm leading-7 text-charcoal/60">
            <p>Complimentary shipping on orders above ₹2,999.</p>
            <p>Dispatch usually takes 3–7 working days for ready pieces.</p>
            <p>Made-to-order and bridal pieces may require additional crafting time.</p>
          </div>
        </details>
      </div>
    </motion.div>
  );
}