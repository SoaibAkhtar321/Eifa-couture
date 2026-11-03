'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSyncExternalStore, type ReactNode } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/ui-store';
import { useWishlistStore } from '@/store/wishlist-store';
import { useCartStore } from '@/store/cart-store';

const subscribe = () => () => {};
const useHydrated = () => useSyncExternalStore(subscribe, () => true, () => false);

// Pages with their own bottom action bar (product / checkout) hide the nav.
const HIDDEN_PREFIXES = ['/product/', '/checkout', '/order-confirmation'];

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

function Count({ value }: { value: number }) {
  if (value <= 0) return null;
  return (
    <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-maroon px-1 text-[9px] font-medium text-white">
      {value > 99 ? '99+' : value}
    </span>
  );
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const openSearch = useUIStore((state) => state.openSearch);
  const openCart = useUIStore((state) => state.openCart);
  const isSearchOpen = useUIStore((state) => state.isSearchOpen);
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const cartCount = useCartStore((state) => state.getItemCount());
  const { isAuthenticated } = useAuth();

  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null;

  const itemClass = (active: boolean) =>
    `relative flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] tracking-wide transition-colors ${
      active ? 'text-maroon' : 'text-charcoal/75'
    }`;

  return (
    <>
      {/* Spacer so page content/footer is never hidden behind the bar */}
      <div className="h-[calc(60px+env(safe-area-inset-bottom))] lg:hidden" aria-hidden="true" />

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-(--z-header) border-t border-beige bg-white/97 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex h-[60px] items-stretch">
          <Link href="/" className={itemClass(pathname === '/')} aria-current={pathname === '/' ? 'page' : undefined}>
            <Icon>
              <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
            </Icon>
            Home
          </Link>

          <Link href="/shop" className={itemClass(pathname.startsWith('/shop'))} aria-current={pathname.startsWith('/shop') ? 'page' : undefined}>
            <Icon>
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </Icon>
            Shop
          </Link>

          <button type="button" onClick={openSearch} className={itemClass(isSearchOpen || pathname.startsWith('/search'))}>
            <Icon>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </Icon>
            Search
          </button>

          <Link href="/wishlist" className={itemClass(pathname.startsWith('/wishlist'))}>
            <span className="relative">
              <Icon>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </Icon>
              <Count value={hydrated ? wishlistCount : 0} />
            </span>
            Wishlist
          </Link>

          <button type="button" onClick={openCart} className={itemClass(false)}>
            <span className="relative">
              <Icon>
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
              </Icon>
              <Count value={hydrated ? cartCount : 0} />
            </span>
            Bag
          </button>

          <Link
            href={hydrated && isAuthenticated ? '/account' : '/login'}
            className={itemClass(pathname.startsWith('/account') || pathname === '/login')}
          >
            <Icon>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </Icon>
            {hydrated && isAuthenticated ? 'Account' : 'Sign In'}
          </Link>
        </div>
      </nav>
    </>
  );
}
