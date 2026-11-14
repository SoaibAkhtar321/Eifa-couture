'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { useCartStore } from '@/store/cart-store';
import { useUIStore } from '@/store/ui-store';
import { useWishlistStore } from '@/store/wishlist-store';
import { useAuth } from '@/hooks/useAuth';
import { getUserInitial } from '@/lib/user-display';

import AnnouncementBar from './AnnouncementBar';
import MobileMenu from './MobileMenu';
import HeaderSearch, { SearchTrigger } from '@/components/search/HeaderSearch';
import NotificationBell from '@/components/notifications/NotificationBell';

// ── Minimalist Luxury Navigation ──
const CORE_LINKS = [
  { label: 'Women', href: '/women' },
  { label: 'Men', href: '/men' },
  { label: 'Accessories', href: '/accessories' },
  { label: 'Shop All', href: '/shop' },
  { label: 'New Arrivals', href: '/shop?collection=new-arrivals' },
  { label: 'Best Sellers', href: '/shop?collection=best-sellers' },
];

const subscribeToHydration = () => () => {};

function useHasHydrated() {
  return useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false
  );
}

interface HeaderProps {
  /** Admin-created collection pages marked "Show in menu". */
  extraLinks?: { label: string; href: string }[];
}

export default function Header({ extraLinks = [] }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const hasMounted = useHasHydrated();

  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === '/';

  // Header lives in the shared layout, so it survives client navigations.
  // Counting route changes tells us whether "back" stays inside the store
  // (router.back) or the visitor landed here directly (go Home instead).
  const routeChanges = useRef(0);
  const lastPath = useRef(pathname);
  useEffect(() => {
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      routeChanges.current += 1;
    }
  }, [pathname]);

  const goBack = () => {
    if (routeChanges.current > 0) router.back();
    else router.push('/');
  };

  const openCart = useUIStore((state) => state.openCart);
  const openMobileMenu = useUIStore((state) => state.openMobileMenu);

  const cartItemCount = useCartStore((state) => state.getItemCount());
  const wishlistCount = useWishlistStore((state) => state.items.length);

  const { isAuthenticated, user, isLoading: loading } = useAuth();
  const initial = getUserInitial(user);

  const visibleCartItemCount = hasMounted ? cartItemCount : 0;
  const visibleWishlistCount = hasMounted ? wishlistCount : 0;
  // While auth state is resolving, default to the guest icon so there's
  // no flash of "My Account" before session is confirmed.
  const showAccountIcon = hasMounted && !loading && isAuthenticated;

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
        className={`sticky top-0 z-(--z-header) border-b border-beige transition-all duration-500 pointer-events-auto ${
          scrolled
            ? 'bg-ivory/96 shadow-[0_8px_24px_rgba(0,0,0,0.045)] backdrop-blur-md'
            : 'bg-ivory/92 backdrop-blur-sm'
        }`}
      >
        <div className="mx-auto w-full max-w-[1400px] px-3 sm:px-6 lg:px-12 xl:px-16">
          <div className="flex h-14 items-center gap-2 sm:h-[78px] sm:gap-4 lg:h-[84px] lg:justify-between">
            {/* ── Mobile back (inner pages only) ── */}
            {!isHome && (
              <button
                type="button"
                onClick={goBack}
                className="tap-feedback -ml-1 flex h-10 w-9 shrink-0 items-center justify-center text-ink-soft lg:hidden"
                aria-label="Go back"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
            )}

            {/* ── Logo ── */}
            <Link
              href="/"
              className="group flex shrink-0 items-center min-h-[44px] pointer-events-auto"
              aria-label="Eifa Couture home"
            >
              {!logoFailed ? (
                <span className="relative block h-[46px] w-[60px] sm:h-[68px] sm:w-[92px] lg:h-[76px] lg:w-[105px]">
                  <Image
                    src="/images/eifa-logo-header.png"
                    alt="Eifa Couture"
                    fill
                    priority
                    sizes="(max-width: 640px) 60px, 105px"
                    className="object-contain object-left"
                    onError={() => setLogoFailed(true)}
                  />
                </span>
              ) : (
                <span className="flex flex-col">
                  <span className="font-heading text-[18px] uppercase tracking-[0.2em] text-charcoal sm:text-[28px] sm:tracking-[0.24em]">
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
              {[...CORE_LINKS, ...extraLinks.slice(0, 3)].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="relative py-2 font-body text-[11px] uppercase tracking-[0.15em] text-ink-soft transition-colors duration-300 hover:text-maroon xl:text-[12px] min-h-[44px] flex items-center group"
                >
                  {link.label}
                  <span className="absolute bottom-1 left-0 h-px w-0 bg-gold transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </nav>

            {/* ── Mobile / tablet search field (the ONLY search control below lg) ── */}
            <div className="flex min-w-0 flex-1 lg:hidden">
              <SearchTrigger variant="bar" />
            </div>

            {/* ── Header Actions ── */}
            <div className="flex shrink-0 items-center sm:gap-2">
              {/* Desktop search icon */}
              <div className="hidden lg:block">
                <SearchTrigger variant="icon" />
              </div>

              {/* Account (Desktop Only) — auth-aware */}
              {showAccountIcon ? (
                <Link
                  href="/account"
                  className="hidden items-center gap-2 px-2 text-ink-soft transition-colors duration-300 hover:text-maroon lg:flex pointer-events-auto"
                  aria-label="My Account"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-maroon font-body text-[11px] font-medium text-white pointer-events-none">
                    {initial}
                  </span>
                  <span className="font-body text-[10px] uppercase tracking-[0.15em] hidden xl:block">
                    My Account
                  </span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="hidden items-center gap-2 text-ink-soft transition-colors duration-300 hover:text-maroon lg:flex px-2 pointer-events-auto"
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
              )}

              {/* Notifications (signed-in only) */}
              {showAccountIcon && (
                <div className="hidden sm:block">
                  <NotificationBell />
                </div>
              )}

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="tap-feedback relative hidden h-11 w-11 items-center justify-center text-ink-soft hover:text-maroon sm:flex min-h-[44px] min-w-[44px] pointer-events-auto"
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
                className="tap-feedback relative flex h-11 w-11 items-center justify-center text-ink-soft hover:text-maroon min-h-[44px] min-w-[44px] pointer-events-auto cursor-pointer"
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
                className="tap-feedback flex h-11 w-11 items-center justify-center text-ink-soft hover:text-maroon lg:hidden min-h-[44px] min-w-[44px] pointer-events-auto cursor-pointer"
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

      <HeaderSearch />
      <MobileMenu extraLinks={extraLinks} />
    </>
  );
}