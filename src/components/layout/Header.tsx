'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { useCartStore } from '@/store/cart-store';
import { useUIStore } from '@/store/ui-store';
import { useWishlistStore } from '@/store/wishlist-store';

import AnnouncementBar from './AnnouncementBar';
import MobileMenu from './MobileMenu';
import HeaderSearch from '@/components/search/HeaderSearch';

// ── Minimalist Luxury Navigation ──
const CORE_LINKS = [
  { label: 'Women', href: '/shop?category=womens-kurtas' },
  { label: 'Men', href: '/shop?category=mens-kurtas' },
  { label: 'Bridal', href: '/shop?category=bridal-collection' },
  { label: 'New Arrivals', href: '/shop?collection=new-arrivals' },
  { label: 'Best Sellers', href: '/shop?collection=best-sellers' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const openCart = useUIStore((state) => state.openCart);
  const openMobileMenu = useUIStore((state) => state.openMobileMenu);

  const cartItemCount = useCartStore((state) => state.getItemCount());
  const wishlistCount = useWishlistStore((state) => state.items.length);

  const visibleCartItemCount = hasMounted ? cartItemCount : 0;
  const visibleWishlistCount = hasMounted ? wishlistCount : 0;

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 18);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      <AnnouncementBar />

      <header
        className={`sticky top-0 z-[130] border-b border-beige transition-all duration-500 pointer-events-auto ${
          scrolled
            ? 'bg-ivory/96 shadow-[0_8px_24px_rgba(0,0,0,0.045)] backdrop-blur-md'
            : 'bg-ivory/92 backdrop-blur-sm'
        }`}
      >
        <div className="luxury-container">
          <div className="flex h-[72px] items-center justify-between gap-4 sm:h-[78px] lg:h-[84px]">
            
            {/* ── Logo ── */}
            <Link
              href="/"
              className="group flex min-w-0 shrink items-center min-h-[44px] min-w-[44px] pointer-events-auto"
              aria-label="Eifa Couture home"
            >
              {!logoFailed ? (
                <span className="relative block h-[62px] w-[82px] sm:h-[68px] sm:w-[92px] lg:h-[76px] lg:w-[105px]">
                  <Image
                    src="/images/eifa-logo-header.png"
                    alt="Eifa Couture"
                    fill
                    priority
                    sizes="105px"
                    className="object-contain object-left"
                    onError={() => setLogoFailed(true)}
                  />
                </span>
              ) : (
                <span className="flex flex-col">
                  <span className="font-heading text-[24px] uppercase tracking-[0.24em] text-charcoal sm:text-[28px]">
                    Eifa Couture
                  </span>
                  <span className="mt-1 font-body text-[9px] uppercase tracking-[0.36em] text-gold sm:text-[10px]">
                    Lucknowi Chikankari
                  </span>
                </span>
              )}
            </Link>

            {/* ── Desktop Navigation ── */}
            <nav
              className="hidden items-center gap-8 lg:flex pointer-events-auto"
              aria-label="Main navigation"
            >
              {CORE_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="relative py-2 font-body text-[11px] uppercase tracking-[0.15em] text-charcoal/75 transition-colors duration-300 hover:text-maroon xl:text-[12px] min-h-[44px] flex items-center group"
                >
                  {link.label}
                  <span className="absolute bottom-1 left-0 h-px w-0 bg-gold transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </nav>

            {/* ── Header Actions ── */}
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <HeaderSearch />

              {/* Login / Register (Desktop Only) */}
              <Link
                href="/login"
                className="hidden items-center gap-2 text-charcoal/55 transition-colors duration-300 hover:text-maroon lg:flex px-2 pointer-events-auto"
                aria-label="Sign In or Register"
              >
                <svg
                  className="pointer-events-none"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.55"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="font-body text-[10px] uppercase tracking-[0.15em] hidden xl:block">
                  Sign In
                </span>
              </Link>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="relative hidden h-11 w-11 items-center justify-center text-charcoal/55 transition-colors duration-300 hover:text-maroon sm:flex min-h-[44px] min-w-[44px] pointer-events-auto"
                aria-label={`Wishlist${
                  visibleWishlistCount > 0 ? ` (${visibleWishlistCount} items)` : ''
                }`}
              >
                <svg
                  className="pointer-events-none"
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.55"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {visibleWishlistCount > 0 && (
                  <span className="absolute right-1 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-maroon px-1 font-body text-[10px] font-medium text-white">
                    {visibleWishlistCount > 99 ? '99+' : visibleWishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <button
                type="button"
                onClick={openCart}
                className="relative flex h-11 w-11 items-center justify-center text-charcoal/55 transition-colors duration-300 hover:text-maroon min-h-[44px] min-w-[44px] pointer-events-auto cursor-pointer"
                aria-label={`Shopping bag${
                  visibleCartItemCount > 0 ? ` (${visibleCartItemCount} items)` : ''
                }`}
              >
                <svg
                  className="pointer-events-none"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.55"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                {visibleCartItemCount > 0 && (
                  <span className="absolute right-1 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-maroon px-1 font-body text-[10px] font-medium text-white">
                    {visibleCartItemCount > 99 ? '99+' : visibleCartItemCount}
                  </span>
                )}
              </button>

              {/* Mobile Hamburger Menu */}
              <button
                type="button"
                onClick={openMobileMenu}
                className="flex h-11 w-11 items-center justify-center text-charcoal/55 transition-colors duration-300 hover:text-maroon lg:hidden min-h-[44px] min-w-[44px] pointer-events-auto cursor-pointer"
                aria-label="Open menu"
              >
                <svg
                  className="pointer-events-none"
                  width="25"
                  height="25"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.45"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="18" y2="12" />
                  <line x1="4" y1="17" x2="16" y2="17" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileMenu />
    </>
  );
}