'use client';

import { FormEvent, useMemo, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';


import { SHIPPING_INFO } from '@/lib/constants';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';

import type { CartItem, Product } from '@/types';

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  'womens-kurtas': '/images/categories/kurtas.png',
  'mens-kurtas': '/images/categories/men-kurtas.png',
  anarkalis: '/images/categories/anarkali.png',
  dupattas: '/images/categories/dupattas.png',
  sarees: '/images/categories/sarees.png',
  'palazzo-sets': '/images/categories/palazzo.png',
  'bridal-collection': '/images/categories/bridal.png',
  accessories: '/images/categories/accessories.png',
};

const DEFAULT_PRODUCT_IMAGE = '/images/categories/kurtas.png';
const subscribeToHydration = () => () => {};

type BuyNowSessionItem = {
  product: Product;
  size: string;
  color: string;
  quantity: number;
};

function useHasHydrated() {
  return useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false
  );
}

function getBuyNowSnapshot() {
  if (typeof window === 'undefined') return '';

  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.get('mode') !== 'buy-now') return '';

  return sessionStorage.getItem('eifa-buy-now') ?? 'null';
}

function parseBuyNowItem(snapshot: string): CartItem | null {
  if (!snapshot || snapshot === 'null') return null;

  try {
    const parsed = JSON.parse(snapshot) as Partial<BuyNowSessionItem>;

    if (
      !parsed.product ||
      !parsed.size ||
      !parsed.color ||
      typeof parsed.quantity !== 'number'
    ) {
      return null;
    }

    return {
      product: parsed.product,
      selectedSize: parsed.size,
      selectedColor: parsed.color,
      quantity: parsed.quantity,
    };
  } catch {
    console.error('Failed to parse buy now item');
    return null;
  }
}

function getProductImage(product: Product) {
  const image = product.images?.[0];

  if (!image || image.includes('picsum.photos')) {
    return CATEGORY_FALLBACK_IMAGES[product.category] || DEFAULT_PRODUCT_IMAGE;
  }

  return image;
}

export default function CheckoutPage() {
  const hasHydrated = useHasHydrated();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const buyNowSnapshot = useSyncExternalStore(
    subscribeToHydration,
    getBuyNowSnapshot,
    () => ''
  );
  const isBuyNowMode = buyNowSnapshot.length > 0;
  const buyNowItem = useMemo(
    () => parseBuyNowItem(buyNowSnapshot),
    [buyNowSnapshot]
  );

  // Global Cart State
  const cartItems = useCartStore((state) => state.items);
  const cartSubtotal = useCartStore((state) => state.getTotal());
  const clearCart = useCartStore((state) => state.clearCart);

  // Determine which items and subtotal to display
  const displayItems = isBuyNowMode && buyNowItem ? [buyNowItem] : cartItems;
  const displaySubtotal = isBuyNowMode && buyNowItem 
    ? buyNowItem.product.price * buyNowItem.quantity 
    : cartSubtotal;

  const itemCount = displayItems.reduce((sum, item) => sum + item.quantity, 0);

  const shippingCharge = useMemo(() => {
    if (displayItems.length === 0) return 0;

    return displaySubtotal >= SHIPPING_INFO.freeShippingThreshold
      ? 0
      : SHIPPING_INFO.standardShippingCost;
  }, [displayItems.length, displaySubtotal]);

  const total = displaySubtotal + shippingCharge;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitted(true);
    
    // Only clear global cart if it was a standard checkout
    if (isBuyNowMode) {
      sessionStorage.removeItem('eifa-buy-now');
    } else {
      clearCart();
    }
    
    event.currentTarget.reset();

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // Prevent hydration mismatch
  if (!hasHydrated) return null;

  return (
    <>

      <main className="bg-ivory">
        <section className="border-b border-beige bg-gradient-to-b from-cream/70 to-ivory">
          <div className="luxury-container py-5 sm:py-6">
            <nav
              aria-label="Breadcrumb"
              className="mb-5 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-charcoal/45 sm:text-[11px]"
            >
              <Link href="/" className="hover:text-maroon">
                Home
              </Link>

              <span>/</span>

              <Link href="/shop" className="hover:text-maroon">
                Shop
              </Link>

              <span>/</span>

              <span className="text-charcoal/70">Checkout</span>
            </nav>

            <div className="max-w-2xl">
              <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.3em] text-gold sm:text-xs">
                Secure Checkout
              </span>

              <h1 className="font-heading text-4xl leading-tight text-charcoal sm:text-5xl lg:text-6xl">
                Complete Your Order
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-charcoal/55 sm:text-base">
                Add your contact and shipping details. Payment integration will
                be connected later.
              </p>
            </div>
          </div>
        </section>

        <section className="py-8 sm:py-12 lg:py-16">
          <div className="luxury-container">
            {isSubmitted ? (
              <div className="mx-auto max-w-2xl border border-gold/40 bg-white px-6 py-12 text-center shadow-sm sm:px-10">
                <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-2xl text-gold">
                  ✓
                </span>

                <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.3em] text-gold sm:text-xs">
                  Demo Order Placed
                </span>

                <h2 className="font-heading text-3xl text-charcoal sm:text-4xl">
                  Thank You For Your Order
                </h2>

                <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-charcoal/55 sm:text-base">
                  Your demo order has been received. Real payment and order saving can be connected
                  in the next phase.
                </p>

                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link
                    href="/shop"
                    className="btn-luxury btn-luxury-primary text-center"
                  >
                    Continue Shopping
                  </Link>

                  <Link
                    href="/"
                    className="btn-luxury btn-luxury-secondary text-center"
                  >
                    Back To Home
                  </Link>
                </div>
              </div>
            ) : displayItems.length === 0 ? (
              <div className="mx-auto max-w-xl border border-beige bg-white px-6 py-12 text-center">
                <h2 className="font-heading text-3xl text-charcoal">
                  Your bag is empty
                </h2>

                <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-charcoal/55">
                  Add handcrafted Chikankari pieces to your bag before checkout.
                </p>

                <Link
                  href="/shop"
                  className="btn-luxury btn-luxury-primary mt-8 inline-flex"
                >
                  Continue Shopping
                </Link>
              </div>
            ) : (
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-12">
                <form
                  onSubmit={handleSubmit}
                  className="space-y-6 border border-beige bg-white p-5 sm:p-7 lg:p-8"
                >
                  <div>
                    <span className="mb-2 block font-body text-[10px] uppercase tracking-[0.26em] text-gold">
                      Contact Details
                    </span>

                    <h2 className="font-heading text-2xl text-charcoal sm:text-3xl">
                      Customer Information
                    </h2>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-charcoal/55">
                        Full Name
                      </span>

                      <input
                        required
                        type="text"
                        name="fullName"
                        placeholder="Enter your name"
                        className="w-full border border-beige bg-ivory px-4 py-3 text-sm text-charcoal outline-none transition-colors focus:border-gold"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-charcoal/55">
                        Phone Number
                      </span>

                      <input
                        required
                        type="tel"
                        name="phone"
                        placeholder="10-digit mobile number"
                        className="w-full border border-beige bg-ivory px-4 py-3 text-sm text-charcoal outline-none transition-colors focus:border-gold"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-charcoal/55">
                      Email Address
                    </span>

                    <input
                      required
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      className="w-full border border-beige bg-ivory px-4 py-3 text-sm text-charcoal outline-none transition-colors focus:border-gold"
                    />
                  </label>

                  <div className="pt-4">
                    <span className="mb-2 block font-body text-[10px] uppercase tracking-[0.26em] text-gold">
                      Shipping Details
                    </span>

                    <h2 className="font-heading text-2xl text-charcoal sm:text-3xl">
                      Delivery Address
                    </h2>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-charcoal/55">
                      Complete Address
                    </span>

                    <textarea
                      required
                      name="address"
                      rows={4}
                      placeholder="House number, street, area, landmark"
                      className="w-full resize-none border border-beige bg-ivory px-4 py-3 text-sm text-charcoal outline-none transition-colors focus:border-gold"
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="block">
                      <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-charcoal/55">
                        City
                      </span>

                      <input
                        required
                        type="text"
                        name="city"
                        className="w-full border border-beige bg-ivory px-4 py-3 text-sm text-charcoal outline-none transition-colors focus:border-gold"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-charcoal/55">
                        State
                      </span>

                      <input
                        required
                        type="text"
                        name="state"
                        className="w-full border border-beige bg-ivory px-4 py-3 text-sm text-charcoal outline-none transition-colors focus:border-gold"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-charcoal/55">
                        Pincode
                      </span>

                      <input
                        required
                        type="text"
                        name="pincode"
                        inputMode="numeric"
                        pattern="[0-9]{6}"
                        placeholder="6 digits"
                        className="w-full border border-beige bg-ivory px-4 py-3 text-sm text-charcoal outline-none transition-colors focus:border-gold"
                      />
                    </label>
                  </div>

                  <div className="border border-beige bg-cream/55 p-4">
                    <p className="text-sm leading-7 text-charcoal/60">
                      Payment gateway is not connected yet. This checkout page
                      is ready for UI/demo flow. Later we can connect Razorpay,
                      Cashfree, Stripe, or WhatsApp order confirmation.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="btn-luxury btn-luxury-primary w-full"
                  >
                    Place Demo Order
                  </button>
                </form>

                <aside className="h-fit border border-beige bg-white p-5 sm:p-6 lg:sticky lg:top-28">
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="font-heading text-2xl text-charcoal">
                      Order Summary
                    </h2>

                    <span className="text-xs uppercase tracking-[0.18em] text-charcoal/45">
                      {itemCount} items
                    </span>
                  </div>

                  <div className="divide-y divide-beige/70">
                    {displayItems.map((item) => {
                      const itemKey = `${item.product.id}-${item.selectedSize}-${item.selectedColor}`;
                      const productImage = getProductImage(item.product);

                      return (
                        <div key={itemKey} className="flex gap-4 py-4">
                          <div className="relative h-24 w-20 shrink-0 overflow-hidden bg-beige">
                            <Image
                              src={productImage}
                              alt={item.product.name}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="line-clamp-2 font-subheading text-base leading-snug text-charcoal">
                              {item.product.name}
                            </h3>

                            <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-charcoal/45">
                              {item.selectedSize} / {item.selectedColor}
                            </p>

                            <p className="mt-2 text-sm text-charcoal/60">
                              Qty: {item.quantity}
                            </p>
                          </div>

                          <p className="shrink-0 text-sm text-charcoal">
                            {formatPrice(item.product.price * item.quantity)}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 space-y-3 border-t border-beige pt-5">
                    <div className="flex items-center justify-between text-sm text-charcoal/60">
                      <span>Subtotal</span>
                      <span>{formatPrice(displaySubtotal)}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-charcoal/60">
                      <span>Shipping</span>
                      <span>
                        {shippingCharge === 0
                          ? 'Complimentary'
                          : formatPrice(shippingCharge)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-beige pt-4">
                      <span className="font-body text-xs uppercase tracking-[0.2em] text-charcoal/55">
                        Total
                      </span>

                      <span className="font-heading text-2xl text-charcoal">
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </section>
      </main>

    </>
  );
}
