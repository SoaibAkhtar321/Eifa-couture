'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, type Variants } from 'framer-motion';

import { NAV_LINKS, SOCIAL_LINKS } from '@/lib/constants';
import { useUIStore } from '@/store/ui-store';

const overlayVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.25,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      delay: 0.08,
    },
  },
};

const panelVariants: Variants = {
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
      ease: [0.55, 0.06, 0.68, 0.19],
    },
  },
};

const listVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.18,
    },
  },
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 22,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.32,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

const mobileLinkMap: Record<string, string> = {
  Shop: '/shop',
  'New Arrivals': '/shop?collection=new-arrivals',
  'Best Sellers': '/shop?collection=best-sellers',
  Bridal: '/shop?category=bridal-collection',
  'Our Story': '/about',
  Journal: '/blog',
  Contact: '/contact',
};

const shopChildLinkMap: Record<string, string> = {
  "Women's Kurtas": '/shop?category=womens-kurtas',
  "Men's Kurtas": '/shop?category=mens-kurtas',
  Anarkalis: '/shop?category=anarkalis',
  Dupattas: '/shop?category=dupattas',
  Sarees: '/shop?category=sarees',
  'Palazzo Sets': '/shop?category=palazzo-sets',
  'Bridal Collection': '/shop?category=bridal-collection',
  Accessories: '/shop?category=accessories',
};

function getMobileHref(label: string, fallbackHref: string) {
  return mobileLinkMap[label] ?? fallbackHref;
}

function getShopChildHref(label: string, fallbackHref: string) {
  return shopChildLinkMap[label] ?? fallbackHref;
}

export default function MobileMenu() {
  const [expandedItem, setExpandedItem] = useState<string | null>('Shop');

  const isMobileMenuOpen = useUIStore((state) => state.isMobileMenuOpen);
  const closeMobileMenu = useUIStore((state) => state.closeMobileMenu);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileMenuOpen]);

  const handleToggleAccordion = (label: string) => {
    setExpandedItem((current) => (current === label ? null : label));
  };

  const handleLinkClick = () => {
    closeMobileMenu();
    setExpandedItem('Shop');
  };

  return (
    <AnimatePresence>
      {isMobileMenuOpen && (
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-[120] lg:hidden"
        >
          <button
            type="button"
            aria-label="Close menu"
            onClick={closeMobileMenu}
            className="absolute inset-0 bg-charcoal/45 backdrop-blur-[2px]"
          />

          <motion.aside
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-y-0 right-0 flex h-dvh w-full flex-col overflow-hidden bg-ivory shadow-[-12px_0_45px_rgba(0,0,0,0.12)] sm:max-w-[460px]"
          >
            <div className="flex items-center justify-between border-b border-beige px-6 py-6">
              <Link
                href="/"
                onClick={handleLinkClick}
                className="group flex flex-col items-start"
                aria-label="Eifa Couture — Home"
              >
                <span className="font-heading text-2xl tracking-[0.24em] text-charcoal transition-colors duration-300 group-hover:text-maroon">
                  EIFA COUTURE
                </span>

                <span className="mt-[-2px] font-subheading text-[10px] uppercase tracking-[0.34em] text-gold">
                  Lucknowi Chikankari
                </span>
              </Link>

              <button
                type="button"
                onClick={closeMobileMenu}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-beige bg-white text-2xl text-charcoal/60 transition-all duration-300 hover:border-maroon hover:bg-maroon hover:text-white"
                aria-label="Close menu"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-7">
              <motion.nav
                variants={listVariants}
                initial="hidden"
                animate="visible"
                aria-label="Mobile navigation"
                className="space-y-1"
              >
                {NAV_LINKS.map((link) => {
                  const hasChildren = Boolean(link.children?.length);
                  const isExpanded = expandedItem === link.label;

                  if (hasChildren) {
                    return (
                      <motion.div
                        key={link.label}
                        variants={itemVariants}
                        className="border-b border-beige"
                      >
                        <div className="flex items-center justify-between">
                          <Link
                            href={getMobileHref(link.label, link.href)}
                            onClick={handleLinkClick}
                            className="flex-1 py-5 font-body text-[15px] font-medium uppercase tracking-[0.32em] text-charcoal transition-colors duration-300 hover:text-maroon"
                          >
                            {link.label}
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleToggleAccordion(link.label)}
                            className="flex h-12 w-12 items-center justify-center text-2xl text-maroon transition-transform duration-300"
                            aria-label={
                              isExpanded
                                ? `Collapse ${link.label}`
                                : `Expand ${link.label}`
                            }
                            aria-expanded={isExpanded}
                          >
                            <span
                              className={`transition-transform duration-300 ${
                                isExpanded ? 'rotate-45' : ''
                              }`}
                            >
                              +
                            </span>
                          </button>
                        </div>

                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.28, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              <div className="grid gap-1 pb-5 pl-4">
                                {link.children?.map((child) => (
                                  <Link
                                    key={child.href}
                                    href={getShopChildHref(child.label, child.href)}
                                    onClick={handleLinkClick}
                                    className="py-2 font-subheading text-[17px] tracking-wide text-charcoal/65 transition-colors duration-300 hover:text-maroon"
                                  >
                                    {child.label}
                                  </Link>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.div
                      key={link.label}
                      variants={itemVariants}
                      className="border-b border-beige"
                    >
                      <Link
                        href={getMobileHref(link.label, link.href)}
                        onClick={handleLinkClick}
                        className="block py-5 font-body text-[15px] font-medium uppercase tracking-[0.32em] text-charcoal transition-colors duration-300 hover:text-maroon"
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.nav>

              <div className="mt-8 border border-beige bg-cream/65 p-6">
                <p className="font-subheading text-3xl text-maroon">
                  Since 1998
                </p>

                <p className="mt-4 text-sm leading-7 text-charcoal/60">
                  Premium handcrafted Lucknowi Chikankari shaped by heritage,
                  patience, and refined luxury.
                </p>
              </div>
            </div>

            <div className="border-t border-beige bg-ivory px-6 py-5">
              <div className="grid grid-cols-2 gap-3">
                {SOCIAL_LINKS.slice(0, 4).map((social) => (
                  <a
                    key={social.href}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className="border border-beige bg-white px-4 py-3 text-center text-[11px] font-medium uppercase tracking-[0.22em] text-charcoal/60 transition-all duration-300 hover:border-maroon hover:bg-maroon hover:text-white"
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