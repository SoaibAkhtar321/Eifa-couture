'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, type Variants } from 'framer-motion';

import { NAV_LINKS } from '@/lib/constants';
import { useCartStore } from '@/store/cart-store';
import { useUIStore } from '@/store/ui-store';
import { useWishlistStore } from '@/store/wishlist-store';

import AnnouncementBar from './AnnouncementBar';
import MobileMenu from './MobileMenu';

const dropdownVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
    transition: {
      duration: 0.2,
      ease: 'easeInOut',
    },
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: 'easeOut',
    },
  },
};

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  const openCart = useUIStore((state) => state.openCart);
  const openMobileMenu = useUIStore((state) => state.openMobileMenu);

  const cartItemCount = useCartStore((state) => state.getItemCount());
  const wishlistCount = useWishlistStore((state) => state.items.length);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
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

      <header
        className={`sticky top-0 z-[80] transition-all duration-500 ${
          scrolled
            ? 'bg-ivory/95 shadow-[0_1px_12px_rgba(0,0,0,0.06)] backdrop-blur-md'
            : 'bg-ivory/70 backdrop-blur-sm'
        }`}
      >
        <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

        <div className="luxury-container">
          <div className="flex h-[72px] items-center justify-between lg:h-[80px]">
            <Link
              href="/"
              className="group flex shrink-0 flex-col items-start"
              aria-label="Eifa Couture — Home"
            >
              <span className="font-heading text-xl tracking-[0.2em] text-charcoal transition-colors duration-300 group-hover:text-maroon lg:text-[22px]">
                EIFA COUTURE
              </span>
              <span className="mt-[-2px] font-subheading text-[9px] uppercase tracking-[0.3em] text-gold lg:text-[10px]">
                Lucknowi Chikankari
              </span>
            </Link>

            <nav
              className="hidden items-center gap-8 lg:flex xl:gap-10"
              role="navigation"
              aria-label="Main navigation"
            >
              {NAV_LINKS.map((link) => (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => {
                    if (link.children) setHoveredNav(link.label);
                  }}
                  onMouseLeave={() => setHoveredNav(null)}
                >
                  <Link
                    href={link.href}
                    className="relative flex items-center gap-1 py-2 font-body text-[12px] uppercase tracking-[0.14em] text-charcoal/80 transition-colors duration-300 hover:text-charcoal"
                    aria-haspopup={link.children ? 'true' : undefined}
                    aria-expanded={link.children ? hoveredNav === link.label : undefined}
                  >
                    {link.label}

                    {link.children && (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`transition-transform duration-200 ${
                          hoveredNav === link.label ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    )}

                    <span
                      className={`absolute bottom-0 left-0 h-px bg-gold transition-all duration-300 ease-out ${
                        hoveredNav === link.label ? 'w-full' : 'w-0'
                      }`}
                    />
                  </Link>

                  {link.children && (
                    <AnimatePresence>
                      {hoveredNav === link.label && (
                        <motion.div
                          variants={dropdownVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          className="absolute left-1/2 top-full -translate-x-1/2 pt-3"
                        >
                          <div className="min-w-[240px] border border-beige bg-white shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
                            <div className="h-[1.5px] bg-gradient-to-r from-transparent via-gold to-transparent" />

                            <div className="py-3">
                              {link.children.map((child) => (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  className="block px-7 py-2.5 font-subheading text-[14px] tracking-wide text-charcoal/70 transition-all duration-200 hover:bg-cream/50 hover:text-maroon"
                                >
                                  {child.label}
                                </Link>
                              ))}
                            </div>

                            <div className="border-t border-beige">
                              <Link
                                href={link.href}
                                className="block px-7 py-3 font-body text-[11px] uppercase tracking-[0.15em] text-gold transition-colors duration-200 hover:text-maroon"
                              >
                                View All →
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              ))}
            </nav>

            <div className="flex items-center gap-3 sm:gap-4 lg:gap-5">
              <button
                className="p-2 text-charcoal/60 transition-colors duration-300 hover:text-charcoal"
                aria-label="Search"
                type="button"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>

              <Link
                href="/wishlist"
                className="relative hidden p-2 text-charcoal/60 transition-colors duration-300 hover:text-charcoal sm:block"
                aria-label={`Wishlist${wishlistCount > 0 ? ` (${wishlistCount} items)` : ''}`}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>

                {wishlistCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-maroon font-body text-[10px] font-medium text-white">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </Link>

              <button
                onClick={openCart}
                className="relative p-2 text-charcoal/60 transition-colors duration-300 hover:text-charcoal"
                aria-label={`Shopping bag${cartItemCount > 0 ? ` (${cartItemCount} items)` : ''}`}
                type="button"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>

                {cartItemCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-maroon font-body text-[10px] font-medium text-white">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </button>

              <Link
                href="/account"
                className="hidden p-2 text-charcoal/60 transition-colors duration-300 hover:text-charcoal lg:block"
                aria-label="My Account"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </Link>

              <button
                onClick={openMobileMenu}
                className="-mr-2 p-2 text-charcoal/60 transition-colors duration-300 hover:text-charcoal lg:hidden"
                aria-label="Open menu"
                type="button"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="18" y2="12" />
                  <line x1="3" y1="18" x2="15" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      </header>

      <MobileMenu />
    </>
  );
}