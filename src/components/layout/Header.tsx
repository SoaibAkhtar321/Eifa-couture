'use client';

import { useCallback, useEffect, useState, type PointerEvent } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, type Variants } from 'framer-motion';

import { NAV_LINKS, SOCIAL_LINKS } from '@/lib/constants';
import { useCartStore } from '@/store/cart-store';
import { useUIStore } from '@/store/ui-store';
import { useWishlistStore } from '@/store/wishlist-store';

import AnnouncementBar from './AnnouncementBar';

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

const mobileOverlayVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.25,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeInOut',
    },
  },
};

const mobilePanelVariants: Variants = {
  hidden: {
    x: '100%',
  },
  visible: {
    x: 0,
    transition: {
      duration: 0.42,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    x: '100%',
    transition: {
      duration: 0.32,
      ease: 'easeInOut',
    },
  },
};

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMobileItem, setExpandedMobileItem] = useState<string | null>(null);

  const openCart = useUIStore((state) => state.openCart);

  const cartItemCount = useCartStore((state) => state.getItemCount());
  const wishlistCount = useWishlistStore((state) => state.items.length);

  const visibleCartItemCount = hasMounted ? cartItemCount : 0;
  const visibleWishlistCount = hasMounted ? wishlistCount : 0;

  useEffect(() => {
    setHasMounted(true);
  }, []);

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

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setExpandedMobileItem(null);
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileMenuOpen]);

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

  const openMobileMenu = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    setHoveredNav(null);
    setIsMobileMenuOpen(true);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
    setExpandedMobileItem(null);
  }, []);

  const toggleMobileItem = (label: string) => {
    setExpandedMobileItem((current) => (current === label ? null : label));
  };

  return (
    <>
      <AnnouncementBar />

      <header
        className={`sticky top-0 z-[300] transition-all duration-500 ${
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
                    if (link.children) {
                      setHoveredNav(link.label);
                    }
                  }}
                  onMouseLeave={() => setHoveredNav(null)}
                >
                  <Link
                    href={link.href}
                    className="relative flex items-center gap-1 py-2 font-body text-[12px] uppercase tracking-[0.14em] text-charcoal/80 transition-colors duration-300 hover:text-charcoal"
                    aria-haspopup={link.children ? 'true' : undefined}
                    aria-expanded={
                      link.children ? hoveredNav === link.label : undefined
                    }
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
                                  href="/shop"
                                  className="block px-7 py-2.5 font-subheading text-[14px] tracking-wide text-charcoal/70 transition-all duration-200 hover:bg-cream/50 hover:text-maroon"
                                >
                                  {child.label}
                                </Link>
                              ))}
                            </div>

                            <div className="border-t border-beige">
                              <Link
                                href="/shop"
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

            <div className="flex items-center gap-2 sm:gap-4 lg:gap-5">
              <button
                type="button"
                className="relative z-[320] flex h-11 w-11 items-center justify-center text-charcoal/60 transition-colors duration-300 hover:text-charcoal"
                aria-label="Search"
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
                className="relative hidden h-11 w-11 items-center justify-center text-charcoal/60 transition-colors duration-300 hover:text-charcoal sm:flex"
                aria-label={`Wishlist${
                  visibleWishlistCount > 0
                    ? ` (${visibleWishlistCount} items)`
                    : ''
                }`}
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

                {visibleWishlistCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-maroon font-body text-[10px] font-medium text-white">
                    {visibleWishlistCount > 99 ? '99+' : visibleWishlistCount}
                  </span>
                )}
              </Link>

              <button
                type="button"
                onClick={openCart}
                className="relative z-[320] flex h-11 w-11 items-center justify-center text-charcoal/60 transition-colors duration-300 hover:text-charcoal"
                aria-label={`Shopping bag${
                  visibleCartItemCount > 0
                    ? ` (${visibleCartItemCount} items)`
                    : ''
                }`}
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

                {visibleCartItemCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-maroon font-body text-[10px] font-medium text-white">
                    {visibleCartItemCount > 99 ? '99+' : visibleCartItemCount}
                  </span>
                )}
              </button>

              <Link
                href="/account"
                className="relative hidden h-11 w-11 items-center justify-center text-charcoal/60 transition-colors duration-300 hover:text-charcoal lg:flex"
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
                type="button"
                onPointerDown={openMobileMenu}
                className="relative z-[330] -mr-2 flex h-11 w-11 items-center justify-center text-charcoal/60 transition-colors duration-300 hover:text-charcoal lg:hidden"
                aria-label="Open menu"
              >
                <svg
                  width="24"
                  height="24"
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

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-[500] lg:hidden"
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.button
              type="button"
              variants={mobileOverlayVariants}
              onClick={closeMobileMenu}
              className="absolute inset-0 bg-charcoal/55 backdrop-blur-sm"
              aria-label="Close menu"
            />

            <motion.aside
              variants={mobilePanelVariants}
              className="absolute right-0 top-0 flex h-full w-[88%] max-w-[390px] flex-col overflow-y-auto border-l border-gold/20 bg-ivory shadow-[0_20px_80px_rgba(0,0,0,0.22)]"
            >
              <div className="flex items-start justify-between border-b border-beige px-6 py-6">
                <Link
                  href="/"
                  onClick={closeMobileMenu}
                  className="flex flex-col items-start"
                  aria-label="Eifa Couture — Home"
                >
                  <span className="font-heading text-xl tracking-[0.22em] text-charcoal">
                    EIFA COUTURE
                  </span>

                  <span className="mt-[-2px] font-subheading text-[9px] uppercase tracking-[0.3em] text-gold">
                    Lucknowi Chikankari
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={closeMobileMenu}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-charcoal/10 text-2xl text-charcoal/60 transition-colors duration-300 hover:border-maroon hover:text-maroon"
                  aria-label="Close menu"
                >
                  ×
                </button>
              </div>

              <nav className="flex-1 px-6 py-6" aria-label="Mobile navigation">
                <div className="space-y-1">
                  {NAV_LINKS.map((link) => {
                    const hasChildren = Boolean(link.children?.length);
                    const isExpanded = expandedMobileItem === link.label;

                    if (hasChildren) {
                      return (
                        <div key={link.label} className="border-b border-beige">
                          <button
                            type="button"
                            onClick={() => toggleMobileItem(link.label)}
                            className="flex w-full items-center justify-between py-4 text-left font-body text-sm uppercase tracking-[0.2em] text-charcoal transition-colors duration-300 hover:text-maroon"
                            aria-expanded={isExpanded}
                          >
                            <span>{link.label}</span>

                            <span
                              className={`text-lg text-maroon transition-transform duration-300 ${
                                isExpanded ? 'rotate-45' : ''
                              }`}
                            >
                              +
                            </span>
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{
                                  duration: 0.25,
                                  ease: 'easeInOut',
                                }}
                                className="overflow-hidden"
                              >
                                <div className="space-y-1 pb-4 pl-4">
                                  <Link
                                    href="/shop"
                                    onClick={closeMobileMenu}
                                    className="block py-2 font-subheading text-base text-maroon"
                                  >
                                    View All Collection
                                  </Link>

                                  {link.children?.map((child) => (
                                    <Link
                                      key={child.href}
                                      href="/shop"
                                      onClick={closeMobileMenu}
                                      className="block py-2 font-subheading text-base text-charcoal/65 transition-colors duration-300 hover:text-maroon"
                                    >
                                      {child.label}
                                    </Link>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    }

                    return (
                      <div key={link.href} className="border-b border-beige">
                        <Link
                          href={link.href === '/' ? '/' : '/shop'}
                          onClick={closeMobileMenu}
                          className="block py-4 font-body text-sm uppercase tracking-[0.2em] text-charcoal transition-colors duration-300 hover:text-maroon"
                        >
                          {link.label}
                        </Link>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 bg-cream p-5">
                  <p className="font-subheading text-2xl text-maroon">
                    Since 1998
                  </p>

                  <p className="mt-2 text-sm leading-7 text-charcoal/60">
                    Premium handcrafted Lucknowi Chikankari shaped by heritage,
                    patience, and refined luxury.
                  </p>
                </div>
              </nav>

              <div className="border-t border-beige px-6 py-5">
                <div className="mb-4 flex flex-wrap gap-2">
                  {SOCIAL_LINKS.map((social) => (
                    <Link
                      key={social.name}
                      href={social.href}
                      onClick={closeMobileMenu}
                      className="border border-charcoal/10 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-charcoal/60 transition-colors duration-300 hover:border-maroon hover:text-maroon"
                    >
                      {social.name}
                    </Link>
                  ))}
                </div>

                <p className="text-[10px] uppercase tracking-[0.22em] text-charcoal/45">
                  Handcrafted with love in Lucknow
                </p>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}