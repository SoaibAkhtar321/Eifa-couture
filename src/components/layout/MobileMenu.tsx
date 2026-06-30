'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, type Variants } from 'framer-motion';

import { SOCIAL_LINKS } from '@/lib/constants';
import { MOCK_CATEGORIES } from '@/lib/mock-data';
import { useUIStore } from '@/store/ui-store';

type MenuLink = {
  label: string;
  href: string;
};

type MenuSection = {
  label: string;
  description: string;
  children: MenuLink[];
};

const quickLinks: MenuLink[] = [
  { label: 'Home', href: '/' },
  { label: 'Shop All', href: '/shop' },
  { label: 'New Arrivals', href: '/shop?collection=new-arrivals' },
  { label: 'Best Sellers', href: '/shop?collection=best-sellers' },
  { label: 'Sign In / Register', href: '/login' }, // ── Added Account Link Here ──
];

const supportLinks: MenuLink[] = [
  { label: 'Our Story', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Size Guide', href: '/size-guide' },
  { label: 'Track Order', href: '/track-order' },
];

function getCategoryHref(slug: string) {
  return `/shop?category=${slug}`;
}

function toMenuLink(category: { name: string; slug: string }): MenuLink {
  return {
    label: category.name,
    href: getCategoryHref(category.slug),
  };
}

function isMenCategory(category: { name: string; slug: string }) {
  const value = `${category.name} ${category.slug}`.toLowerCase();
  return value.includes('men') || value.includes('mens');
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

function buildDynamicMenuSections(): MenuSection[] {
  const activeCategories = MOCK_CATEGORIES.filter((category) => category.isActive)
    .slice()
    .sort((a, b) => a.order - b.order);

  const womenCategories = activeCategories.filter(
    (category) => !isMenCategory(category) && !isAccessoryCategory(category)
  );

  const menCategories = activeCategories.filter(isMenCategory);
  const accessoryCategories = activeCategories.filter(isAccessoryCategory);

  return [
    {
      label: 'Shop Women',
      description: 'Kurtas, sarees, anarkalis, bridal and festive silhouettes.',
      children: womenCategories.map(toMenuLink),
    },
    {
      label: 'Shop Men',
      description: 'Refined handcrafted kurtas for him.',
      children: menCategories.map(toMenuLink),
    },
    {
      label: 'Accessories',
      description: 'Bags, stoles and finishing touches for complete styling.',
      children: accessoryCategories.map(toMenuLink),
    },
  ].filter((section) => section.children.length > 0);
}

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2, delay: 0.08 } },
};

const panelVariants: Variants = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: { duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { x: '100%', transition: { duration: 0.32, ease: [0.55, 0.06, 0.68, 0.19] } },
};

const listVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.14,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: 22 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export default function MobileMenu() {
  const menuSections = useMemo(() => buildDynamicMenuSections(), []);

  const [expandedItem, setExpandedItem] = useState<string | null>(
    menuSections[0]?.label ?? null
  );
  const [logoFailed, setLogoFailed] = useState(false);

  const isMobileMenuOpen = useUIStore((state) => state.isMobileMenuOpen);
  const closeMobileMenu = useUIStore((state) => state.closeMobileMenu);

  const womenQuickHref =
    menuSections.find((section) => section.label === 'Shop Women')?.children[0]?.href ??
    '/shop?category=womens-kurtas';

  const menQuickHref =
    menuSections.find((section) => section.label === 'Shop Men')?.children[0]?.href ??
    '/shop?category=mens-kurtas';

  // Body scroll lock with guaranteed teardown
  useEffect(() => {
    if (isMobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isMobileMenuOpen]);

  // Fallback programmatic body scroll cleanup on unmount/route transitions
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleToggleAccordion = (label: string) => {
    setExpandedItem((current) => (current === label ? null : label));
  };

  const handleLinkClick = () => {
    closeMobileMenu();
    setExpandedItem(menuSections[0]?.label ?? null);
  };

  return (
    <AnimatePresence>
      {isMobileMenuOpen && (
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-[120] lg:hidden h-dvh w-screen overflow-hidden"
        >
          {/* Backdrop layer with pointer-events toggled strictly based on open state */}
          <div
            role="button"
            tabIndex={-1}
            aria-label="Close menu"
            onClick={closeMobileMenu}
            className={`absolute inset-0 z-0 h-full w-full cursor-pointer bg-charcoal/50 backdrop-blur-[2px] transition-opacity duration-300 ${
              isMobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'
            }`}
          />

          {/* Menu panel with explicit z-index avoiding touch interception */}
          <motion.aside
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-y-0 right-0 z-10 flex h-dvh w-full flex-col overflow-y-auto bg-ivory shadow-[-12px_0_45px_rgba(0,0,0,0.12)] sm:max-w-[460px] pointer-events-auto"
          >
            <div className="flex items-center justify-between border-b border-beige bg-ivory px-5 py-4 shrink-0">
              <Link
                href="/"
                onClick={handleLinkClick}
                className="group flex items-center min-h-[44px] min-w-[44px]"
                aria-label="Eifa Couture — Home"
              >
                {!logoFailed ? (
                  <span className="relative block h-[62px] w-[92px]">
                    <Image
                      src="/images/eifa-logo-header.png"
                      alt="Eifa Couture"
                      fill
                      priority
                      sizes="92px"
                      className="object-contain object-left"
                      onError={() => setLogoFailed(true)}
                    />
                  </span>
                ) : (
                  <span className="flex flex-col">
                    <span className="font-heading text-[22px] uppercase tracking-[0.22em] text-charcoal">
                      Eifa Couture
                    </span>
                    <span className="mt-1 font-body text-[9px] uppercase tracking-[0.34em] text-gold">
                      Lucknowi Chikankari
                    </span>
                  </span>
                )}
              </Link>

              <button
                type="button"
                onClick={closeMobileMenu}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-beige bg-white text-2xl text-charcoal/60 transition-all duration-300 hover:border-maroon hover:bg-maroon hover:text-white min-h-[44px] min-w-[44px] cursor-pointer"
                aria-label="Close menu"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6">
              <motion.div
                variants={listVariants}
                initial="hidden"
                animate="visible"
                className="space-y-7"
              >
                <motion.div variants={itemVariants}>
                  <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.34em] text-gold">
                    Start Shopping
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href={womenQuickHref}
                      onClick={handleLinkClick}
                      className="min-h-[44px] flex items-center justify-center border border-maroon bg-maroon px-4 py-4 text-center text-[12px] font-medium uppercase tracking-[0.22em] text-white transition-all duration-300 hover:bg-charcoal"
                    >
                      Women
                    </Link>

                    <Link
                      href={menQuickHref}
                      onClick={handleLinkClick}
                      className="min-h-[44px] flex items-center justify-center border border-gold bg-gold px-4 py-4 text-center text-[12px] font-medium uppercase tracking-[0.22em] text-charcoal transition-all duration-300 hover:border-maroon hover:bg-maroon hover:text-white"
                    >
                      Men
                    </Link>

                    <Link
                      href="/shop?collection=new-arrivals"
                      onClick={handleLinkClick}
                      className="min-h-[44px] flex items-center justify-center border border-beige bg-white px-4 py-4 text-center text-[12px] font-medium uppercase tracking-[0.22em] text-charcoal transition-all duration-300 hover:border-maroon hover:text-maroon"
                    >
                      New
                    </Link>

                    <Link
                      href="/shop?collection=best-sellers"
                      onClick={handleLinkClick}
                      className="min-h-[44px] flex items-center justify-center border border-beige bg-white px-4 py-4 text-center text-[12px] font-medium uppercase tracking-[0.22em] text-charcoal transition-all duration-300 hover:border-maroon hover:text-maroon"
                    >
                      Best
                    </Link>
                  </div>
                </motion.div>

                <motion.nav
                  variants={itemVariants}
                  aria-label="Mobile quick navigation"
                  className="border-y border-beige py-3 space-y-1"
                >
                  {quickLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={handleLinkClick}
                      className="min-h-[44px] flex items-center justify-between py-3 font-body text-[13px] font-medium uppercase tracking-[0.28em] text-charcoal transition-colors duration-300 hover:text-maroon group"
                    >
                      <span>{link.label}</span>
                      <span className="text-gold transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </Link>
                  ))}
                </motion.nav>

                <motion.nav
                  variants={itemVariants}
                  aria-label="Mobile collection navigation"
                  className="space-y-2"
                >
                  {menuSections.map((section) => {
                    const isExpanded = expandedItem === section.label;

                    return (
                      <div
                        key={section.label}
                        className="border border-beige bg-white"
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleAccordion(section.label)}
                          className="min-h-[44px] flex w-full items-center justify-between gap-4 px-4 py-4 text-left cursor-pointer"
                          aria-label={
                            isExpanded
                              ? `Collapse ${section.label}`
                              : `Expand ${section.label}`
                          }
                          aria-expanded={isExpanded}
                        >
                          <span>
                            <span className="block font-heading text-2xl text-charcoal">
                              {section.label}
                            </span>

                            <span className="mt-1 block text-sm leading-6 text-charcoal/50">
                              {section.description}
                            </span>
                          </span>

                          <span
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-beige text-xl text-maroon transition-transform duration-300 min-h-[44px] min-w-[44px] ${
                              isExpanded ? 'rotate-45 bg-cream' : ''
                            }`}
                          >
                            +
                          </span>
                        </button>

                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.28, ease: 'easeInOut' }}
                              className="overflow-hidden border-t border-beige bg-cream/45"
                            >
                              <div className="grid gap-1 px-4 py-4">
                                {section.children.map((child) => (
                                  <Link
                                    key={child.href}
                                    href={child.href}
                                    onClick={handleLinkClick}
                                    className="min-h-[44px] flex items-center justify-between py-2.5 font-subheading text-[18px] tracking-wide text-charcoal/68 transition-colors duration-300 hover:text-maroon"
                                  >
                                    <span>{child.label}</span>
                                    <span className="text-sm text-gold">→</span>
                                  </Link>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </motion.nav>

                <motion.div variants={itemVariants}>
                  <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.34em] text-gold">
                    Eifa Couture
                  </p>

                  <div className="grid gap-1 border border-beige bg-white p-4">
                    {supportLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={handleLinkClick}
                        className="min-h-[44px] flex items-center justify-between py-2.5 font-subheading text-[18px] tracking-wide text-charcoal/62 transition-colors duration-300 hover:text-maroon"
                      >
                        <span>{link.label}</span>
                        <span className="text-sm text-gold">→</span>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            </div>

            <div className="border-t border-beige bg-ivory px-5 py-4 shrink-0">
              <div className="grid grid-cols-3 gap-3">
                {SOCIAL_LINKS.slice(0, 3).map((social) => (
                  <a
                    key={social.href}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className="min-h-[44px] flex items-center justify-center border border-beige bg-white px-3 py-3 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-charcoal/60 transition-all duration-300 hover:border-maroon hover:bg-maroon hover:text-white"
                  >
                    {social.name}
                  </a>
                ))}
              </div>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}