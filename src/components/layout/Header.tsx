'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, type Variants } from 'framer-motion';

import { MOCK_CATEGORIES } from '@/lib/mock-data';
import { useCartStore } from '@/store/cart-store';
import { useUIStore } from '@/store/ui-store';
import { useWishlistStore } from '@/store/wishlist-store';

import AnnouncementBar from './AnnouncementBar';
import MobileMenu from './MobileMenu';
import HeaderSearch from '@/components/search/HeaderSearch';

type HeaderNavLink = {
  label: string;
  href: string;
  children?: {
    label: string;
    href: string;
  }[];
};

const dropdownVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
    transition: { duration: 0.2, ease: 'easeInOut' },
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
};

function getCategoryHref(slug: string) {
  return `/shop?category=${slug}`;
}

function toCategoryLink(category: { name: string; slug: string }) {
  return {
    label: category.name,
    href: getCategoryHref(category.slug),
  };
}

function isMenCategory(category: { name: string; slug: string }) {
  const name = category.name.toLowerCase();
  const slug = category.slug.toLowerCase();
  return name.startsWith('men') || slug.startsWith('mens-');
}

function isAccessoryCategory(category: { name: string; slug: string }) {
  const value = `${category.name} ${category.slug}`.toLowerCase();
  return (
    value.includes('accessor') ||
    value.includes('bag') ||
    value.includes('bags') ||
    value.includes('stole') ||
    value.includes('clutch')
  );
}

function buildDynamicHeaderLinks(): HeaderNavLink[] {
  const activeCategories = MOCK_CATEGORIES.filter((category) => category.isActive)
    .slice()
    .sort((a, b) => a.order - b.order);

  const womenCategories = activeCategories.filter(
    (category) => !isMenCategory(category) && !isAccessoryCategory(category)
  );

  const menCategories = activeCategories.filter(isMenCategory);
  const accessoryCategories = activeCategories.filter(isAccessoryCategory);

  const links: HeaderNavLink[] = [
    {
      label: 'Shop',
      href: '/shop',
      children: activeCategories.map(toCategoryLink),
    },
    {
      label: 'Women',
      href: womenCategories[0]
        ? getCategoryHref(womenCategories[0].slug)
        : '/shop?category=womens-kurtas',
      children: womenCategories.map(toCategoryLink),
    },
    {
      label: 'Men',
      href: menCategories[0]
        ? getCategoryHref(menCategories[0].slug)
        : '/shop?category=mens-kurtas',
      children: menCategories.map(toCategoryLink),
    },
    {
      label: 'Accessories',
      href: accessoryCategories[0]
        ? getCategoryHref(accessoryCategories[0].slug)
        : '/shop?category=accessories',
      children: accessoryCategories.map(toCategoryLink),
    },
    {
      label: 'New',
      href: '/shop?collection=new-arrivals',
    },
    {
      label: 'Best Sellers',
      href: '/shop?collection=best-sellers',
    },
    {
      label: 'Our Story',
      href: '/about',
    },
  ];

  return links.filter((link) => {
    if (!link.children) return true;
    return link.children.length > 0;
  });
}

export default function Header() {
  const navLinks = useMemo(() => buildDynamicHeaderLinks(), []);

  const [scrolled, setScrolled] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
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

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setHoveredNav(null);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <>
      <AnnouncementBar />

      {/* Increased Z-Index stacking context avoids invisible fixed overlay blocks */}
      <header
        className={`sticky top-0 z-[130] border-b border-beige transition-all duration-500 pointer-events-auto ${
          scrolled
            ? 'bg-ivory/96 shadow-[0_8px_24px_rgba(0,0,0,0.045)] backdrop-blur-md'
            : 'bg-ivory/92 backdrop-blur-sm'
        }`}
      >
        <div className="luxury-container">
          <div className="flex h-[72px] items-center justify-between gap-4 sm:h-[78px] lg:h-[84px]">
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

            <nav
              className="hidden items-center gap-6 lg:flex xl:gap-8 pointer-events-auto"
              aria-label="Main navigation"
            >
              {navLinks.map((link) => {
                const hasChildren = Boolean(link.children?.length);

                return (
                  <div
                    key={link.label}
                    className="relative pointer-events-auto"
                    onMouseEnter={() => {
                      if (hasChildren) setHoveredNav(link.label);
                    }}
                    onMouseLeave={() => setHoveredNav(null)}
                  >
                    <Link
                      href={link.href}
                      className="relative flex items-center gap-1 py-2 font-body text-[11px] uppercase tracking-[0.15em] text-charcoal/75 transition-colors duration-300 hover:text-maroon xl:text-[12px] min-h-[44px] pointer-events-auto"
                      aria-haspopup={hasChildren ? 'true' : undefined}
                      aria-expanded={
                        hasChildren ? hoveredNav === link.label : undefined
                      }
                    >
                      {link.label}

                      {hasChildren && (
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`pointer-events-none transition-transform duration-200 ${
                            hoveredNav === link.label ? 'rotate-180' : ''
                          }`}
                          aria-hidden="true"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      )}

                      <span
                        className={`absolute bottom-0 left-0 h-px bg-gold transition-all duration-300 ${
                          hoveredNav === link.label ? 'w-full' : 'w-0'
                        }`}
                      />
                    </Link>

                    {hasChildren && (
                      <AnimatePresence>
                        {hoveredNav === link.label && (
                          <motion.div
                            variants={dropdownVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className="absolute left-1/2 top-full -translate-x-1/2 pt-3"
                          >
                            <div className="min-w-[270px] border border-beige bg-white shadow-[0_14px_42px_rgba(0,0,0,0.08)]">
                              <div className="h-[1.5px] bg-gradient-to-r from-transparent via-gold to-transparent" />

                              <div className="py-3">
                                {link.children?.map((child) => (
                                  <Link
                                    key={child.href}
                                    href={child.href}
                                    className="block px-7 py-2.5 font-subheading text-[15px] tracking-wide text-charcoal/68 transition-all duration-200 hover:bg-cream/60 hover:text-maroon pointer-events-auto"
                                  >
                                    {child.label}
                                  </Link>
                                ))}
                              </div>

                              <div className="border-t border-beige">
                                <Link
                                  href={link.href}
                                  className="block px-7 py-3 font-body text-[11px] uppercase tracking-[0.18em] text-gold transition-colors duration-200 hover:text-maroon pointer-events-auto"
                                >
                                  View All Collection →
                                </Link>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                );
              })}
            </nav>

            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <HeaderSearch />

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

              <Link
                href="/account"
                className="hidden h-11 w-11 items-center justify-center text-charcoal/55 transition-colors duration-300 hover:text-maroon lg:flex min-h-[44px] min-w-[44px] pointer-events-auto"
                aria-label="My Account"
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
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </Link>

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