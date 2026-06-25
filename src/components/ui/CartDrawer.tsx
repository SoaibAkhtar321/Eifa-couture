'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, type Variants } from 'framer-motion';

import { SHIPPING_INFO } from '@/lib/constants';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';
import { useUIStore } from '@/store/ui-store';

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const drawerVariants: Variants = {
  hidden: { x: '100%' },
  visible: {
    x: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  exit: {
    x: '100%',
    transition: { duration: 0.3, ease: 'easeInOut' },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.2, ease: 'easeInOut' },
  },
};

export default function CartDrawer() {
  const isCartOpen = useUIStore((state) => state.isCartOpen);
  const closeCart = useUIStore((state) => state.closeCart);

  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const total = useCartStore((state) => state.getTotal());

  const freeShippingDelta = SHIPPING_INFO.freeShippingThreshold - total;

  useEffect(() => {
    document.body.style.overflow = isCartOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            key="cart-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[100] bg-charcoal/40 backdrop-blur-sm"
            onClick={closeCart}
            aria-hidden="true"
          />

          <motion.aside
            key="cart-drawer"
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed bottom-0 right-0 top-0 z-[110] flex w-full max-w-[460px] flex-col bg-ivory shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping bag"
          >
            <div className="flex items-center justify-between border-b border-beige px-6 py-5">
              <div className="flex items-center gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-charcoal" aria-hidden="true">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>

                <h2 className="font-heading text-lg tracking-wider text-charcoal">
                  Shopping Bag
                </h2>

                <span className="font-body text-xs tracking-wide text-charcoal/40">
                  ({items.length})
                </span>
              </div>

              <button
                onClick={closeCart}
                className="-mr-2 p-2 text-charcoal/50 transition-colors hover:text-charcoal"
                aria-label="Close shopping bag"
                type="button"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {items.length > 0 && (
              <div className="border-b border-beige/50 bg-cream/50 px-6 py-3">
                {freeShippingDelta > 0 ? (
                  <p className="text-center font-subheading text-[13px] tracking-wide text-charcoal/70">
                    Add <span className="font-medium text-maroon">{formatPrice(freeShippingDelta)}</span> more for complimentary shipping
                  </p>
                ) : (
                  <p className="text-center font-subheading text-[13px] tracking-wide text-gold">
                    ✦ You&apos;ve unlocked complimentary shipping ✦
                  </p>
                )}

                <div className="mt-2 h-[2px] overflow-hidden rounded-full bg-beige">
                  <motion.div
                    className="h-full bg-gradient-to-r from-gold to-maroon"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(
                        (total / SHIPPING_INFO.freeShippingThreshold) * 100,
                        100
                      )}%`,
                    }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-6 py-16 text-center">
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" className="mb-6 text-beige" aria-hidden="true">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>

                  <h3 className="mb-2 font-heading text-lg text-charcoal">
                    Your bag is empty
                  </h3>

                  <p className="mb-8 max-w-[260px] font-subheading text-sm tracking-wide text-charcoal/50">
                    Discover our curated collection of handcrafted Chikankari pieces
                  </p>

                  <Link
                    href="/shop"
                    onClick={closeCart}
                    className="btn-luxury btn-luxury-primary"
                  >
                    Explore Collection
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-beige/60">
                  <AnimatePresence initial={false}>
                    {items.map((item) => {
                      const itemKey = `${item.product.id}-${item.selectedSize}-${item.selectedColor}`;

                      return (
                        <motion.li
                          key={itemKey}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          layout
                          className="px-6 py-5"
                        >
                          <div className="flex gap-4">
                            <div className="relative h-[100px] w-[80px] flex-shrink-0 overflow-hidden bg-beige">
                              <Image
                                src={item.product.images[0] || '/placeholder.jpg'}
                                alt={item.product.name}
                                fill
                                className="object-cover"
                                sizes="80px"
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <h4 className="mb-1 truncate font-subheading text-[15px] leading-snug text-charcoal">
                                {item.product.name}
                              </h4>

                              <div className="mb-3 flex items-center gap-2 font-body text-[11px] uppercase tracking-wider text-charcoal/50">
                                <span>{item.selectedSize}</span>
                                <span className="text-beige">|</span>
                                <span>{item.selectedColor}</span>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center border border-beige">
                                  <button
                                    onClick={() =>
                                      updateQuantity(
                                        item.product.id,
                                        item.selectedSize,
                                        item.selectedColor,
                                        item.quantity - 1
                                      )
                                    }
                                    className="flex h-8 w-8 items-center justify-center text-charcoal/50 transition-colors hover:bg-cream hover:text-charcoal"
                                    aria-label={`Decrease quantity of ${item.product.name}`}
                                    type="button"
                                  >
                                    −
                                  </button>

                                  <span className="flex h-8 w-10 items-center justify-center border-x border-beige font-body text-xs text-charcoal">
                                    {item.quantity}
                                  </span>

                                  <button
                                    onClick={() =>
                                      updateQuantity(
                                        item.product.id,
                                        item.selectedSize,
                                        item.selectedColor,
                                        item.quantity + 1
                                      )
                                    }
                                    className="flex h-8 w-8 items-center justify-center text-charcoal/50 transition-colors hover:bg-cream hover:text-charcoal"
                                    aria-label={`Increase quantity of ${item.product.name}`}
                                    type="button"
                                  >
                                    +
                                  </button>
                                </div>

                                <p className="font-body text-sm tracking-wide text-charcoal">
                                  {formatPrice(item.product.price * item.quantity)}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() =>
                                removeItem(
                                  item.product.id,
                                  item.selectedSize,
                                  item.selectedColor
                                )
                              }
                              className="self-start p-1 text-charcoal/30 transition-colors hover:text-maroon"
                              aria-label={`Remove ${item.product.name} from bag`}
                              type="button"
                            >
                              ×
                            </button>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-beige">
                <div className="px-6 py-4">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-body text-xs uppercase tracking-[0.14em] text-charcoal/50">
                      Subtotal
                    </span>
                    <span className="font-heading text-lg text-charcoal">
                      {formatPrice(total)}
                    </span>
                  </div>

                  <p className="font-subheading text-[12px] tracking-wide text-charcoal/40">
                    Taxes and shipping calculated at checkout
                  </p>
                </div>

                <div className="mx-6 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

                <div className="space-y-3 px-6 py-5">
                  <Link
                    href="/checkout"
                    onClick={closeCart}
                    className="btn-luxury btn-luxury-primary w-full text-center"
                  >
                    Checkout
                  </Link>

                  <Link
                    href="/cart"
                    onClick={closeCart}
                    className="btn-luxury btn-luxury-secondary w-full text-center"
                  >
                    View Bag
                  </Link>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}