'use client';

import { FormEvent, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import AddressForm from '@/components/account/AddressForm';
import { useAuth } from '@/hooks/useAuth';
import { createAddress, fetchAddresses, type AddressInput } from '@/lib/addresses';
import { SHIPPING_INFO } from '@/lib/constants';
import { addressToShippingSnapshot, createOrder } from '@/lib/orders';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';

import type { CartItem, Product } from '@/types';
import type { DbAddress } from '@/types/database';

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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const { user, isLoading: isAuthLoading } = useAuth();

  // ── Contact ──
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const emailPrefilled = useRef(false);

  // ── Saved addresses ──
  const [addresses, setAddresses] = useState<DbAddress[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [addressesError, setAddressesError] = useState<string | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressFormError, setAddressFormError] = useState<string | null>(null);

  // ── Order submission ──
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

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

  useEffect(() => {
    if (user?.email && !emailPrefilled.current) {
      emailPrefilled.current = true;
      setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthLoading || !user) return;

    let cancelled = false;

    (async () => {
      setIsLoadingAddresses(true);
      setAddressesError(null);

      const { data, error } = await fetchAddresses(user.id);

      if (cancelled) return;

      if (error) {
        setAddressesError('We could not load your saved addresses.');
      } else {
        setAddresses(data);
        const defaultAddress = data.find((a) => a.is_default) ?? data[0];
        setSelectedAddressId(defaultAddress ? defaultAddress.id : null);
        setIsAddingAddress(data.length === 0);
      }

      setIsLoadingAddresses(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, isAuthLoading]);

  const handleSaveAddress = async (input: AddressInput) => {
    if (!user) return;

    setIsSavingAddress(true);
    setAddressFormError(null);

    const { data, error } = await createAddress(user.id, input);

    setIsSavingAddress(false);

    if (error || !data) {
      setAddressFormError('We could not save this address. Please try again.');
      return;
    }

    setAddresses((prev) => {
      const next = data.is_default ? prev.map((a) => ({ ...a, is_default: false })) : prev;
      return [data, ...next];
    });
    setSelectedAddressId(data.id);
    setIsAddingAddress(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOrderError(null);
    setEmailError(null);

    if (!user) {
      setOrderError('Please sign in to complete your order.');
      return;
    }

    if (!EMAIL_PATTERN.test(email.trim())) {
      setEmailError('Enter a valid email address.');
      return;
    }

    const selectedAddress = addresses.find((a) => a.id === selectedAddressId) ?? null;
    if (!selectedAddress) {
      setOrderError('Please select or add a delivery address.');
      return;
    }

    if (displayItems.length === 0) {
      setOrderError('Your bag is empty.');
      return;
    }

    setIsPlacingOrder(true);

    const shippingAddress = {
      ...addressToShippingSnapshot(selectedAddress),
      email: email.trim(),
    };

    const { data, error } = await createOrder(
      displayItems,
      shippingAddress,
      selectedAddress.id,
      shippingCharge
    );

    if (error || !data) {
      setIsPlacingOrder(false);

      if (error?.type === 'not_authenticated') {
        setOrderError('Your session has expired. Please sign in again to place your order.');
      } else if (error?.type === 'insufficient_stock') {
        setOrderError(`Sorry, "${error.productName}" no longer has enough stock for this quantity.`);
      } else if (error?.type === 'variant_not_found') {
        setOrderError(`${error.itemLabel} is no longer available. Please review your bag.`);
      } else if (error?.type === 'empty_cart') {
        setOrderError('Your bag is empty.');
      } else {
        setOrderError(error?.message ?? 'We could not place your order. Please try again.');
      }
      return;
    }

    // Only clear global cart if it was a standard checkout
    if (isBuyNowMode) {
      sessionStorage.removeItem('eifa-buy-now');
    } else {
      clearCart();
    }

    router.push(`/order-confirmation/${data.id}`);
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
                Confirm your contact details and delivery address. Payment integration will
                be connected later — your order is confirmed as Cash on Delivery for now.
              </p>
            </div>
          </div>
        </section>

        <section className="py-8 sm:py-12 lg:py-16">
          <div className="luxury-container">
            {displayItems.length === 0 ? (
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
            ) : !isAuthLoading && !user ? (
              <div className="mx-auto max-w-xl border border-beige bg-white px-6 py-12 text-center">
                <h2 className="font-heading text-3xl text-charcoal">
                  Sign In To Continue
                </h2>

                <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-charcoal/55">
                  Please sign in to your account so we can confirm and save your order.
                </p>

                <Link
                  href={`/login?next=${encodeURIComponent('/checkout' + (isBuyNowMode ? '?mode=buy-now' : ''))}`}
                  className="btn-luxury btn-luxury-primary mt-8 inline-flex"
                >
                  Sign In
                </Link>
              </div>
            ) : (
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-12">
                <form
                  onSubmit={handleSubmit}
                  noValidate
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

                  <label className="block">
                    <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-charcoal/55">
                      Email Address
                    </span>

                    <input
                      required
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-beige bg-ivory px-4 py-3 text-sm text-charcoal outline-none transition-colors focus:border-gold"
                    />
                    {emailError && (
                      <span className="mt-1 block text-xs text-red-600">{emailError}</span>
                    )}
                  </label>

                  <div className="pt-4">
                    <span className="mb-2 block font-body text-[10px] uppercase tracking-[0.26em] text-gold">
                      Shipping Details
                    </span>

                    <h2 className="font-heading text-2xl text-charcoal sm:text-3xl">
                      Delivery Address
                    </h2>
                  </div>

                  {isLoadingAddresses ? (
                    <p className="text-sm text-charcoal/55">Loading your saved addresses…</p>
                  ) : addressesError ? (
                    <p className="text-sm text-red-600">{addressesError}</p>
                  ) : isAddingAddress ? (
                    <div className="space-y-4">
                      {addressFormError && (
                        <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                          {addressFormError}
                        </p>
                      )}

                      <AddressForm
                        forceDefault={addresses.length === 0}
                        isSubmitting={isSavingAddress}
                        submitLabel="Save & Use This Address"
                        onSubmit={handleSaveAddress}
                        onCancel={() => setIsAddingAddress(false)}
                      />

                      {addresses.length === 0 && (
                        <p className="text-xs text-charcoal/45">
                          This will be saved to your account so future checkouts are faster.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {addresses.map((address) => {
                        const isSelected = address.id === selectedAddressId;

                        return (
                          <label
                            key={address.id}
                            className={`flex cursor-pointer items-start gap-3 border p-4 transition-colors ${
                              isSelected ? 'border-gold bg-gold/5' : 'border-beige hover:border-gold/50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="shippingAddress"
                              className="mt-1 h-4 w-4 accent-maroon"
                              checked={isSelected}
                              onChange={() => setSelectedAddressId(address.id)}
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-subheading text-sm text-charcoal">
                                  {address.full_name}
                                </span>
                                {address.is_default && (
                                  <span className="bg-gold/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-gold">
                                    Default
                                  </span>
                                )}
                              </div>

                              <p className="mt-1 text-sm leading-6 text-charcoal/60">
                                {address.address_line1}
                                {address.address_line2 ? `, ${address.address_line2}` : ''}
                                <br />
                                {address.city}, {address.state} — {address.pincode}
                                <br />
                                Phone: {address.phone}
                              </p>
                            </div>
                          </label>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => setIsAddingAddress(true)}
                        className="text-sm text-maroon transition-colors hover:text-gold"
                      >
                        + Add A New Address
                      </button>
                    </div>
                  )}

                  <div className="border border-beige bg-cream/55 p-4">
                    <p className="text-sm leading-7 text-charcoal/60">
                      Payment gateway is not connected yet. Your order will be placed as Cash
                      on Delivery. Later we can connect Razorpay, Cashfree, Stripe, or
                      WhatsApp order confirmation.
                    </p>
                  </div>

                  {orderError && (
                    <div className="border border-red-200 bg-red-50 p-4">
                      <p className="text-sm leading-6 text-red-700">{orderError}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isPlacingOrder || isAddingAddress}
                    className="btn-luxury btn-luxury-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPlacingOrder ? 'Placing Your Order…' : 'Place Order'}
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
