'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, type Variants } from 'framer-motion';

import { SOCIAL_LINKS } from '@/lib/constants';
import { useUIStore } from '@/store/ui-store';

type MenuLink = {
  label: string;
  href: string;
};

const quickLinks: MenuLink[] = [
  { label: 'Home', href: '/' },
  { label: 'Shop All', href: '/shop' },
  { label: 'New Arrivals', href: '/shop?collection=new-arrivals' },
  { label: 'Best Sellers', href: '/shop?collection=best-sellers' },
];

const accountLinks: MenuLink[] = [
  { label: 'My Orders', href: '/account/orders' },
  { label: 'Track Order', href: '/track-order' },
  { label: 'Wishlist', href: '/wishlist' },
  { label: 'Sign In / Register', href: '/login' },
];

const supportLinks: MenuLink[] = [
  { label: 'Contact', href: '/contact' },
  { label: 'Help Center', href: '/help' },
];

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
  const [logoFailed, setLogoFailed] = useState(false);

  const isMobileMenuOpen = useUIStore((state) => state.isMobileMenuOpen);
  const closeMobileMenu = useUIStore((state) => state.closeMobileMenu);

  // Lock background scroll while the menu is open.
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileMenuOpen]);

  // Close on Escape — no history/popstate involvement, so it can never
  // desync from Next's router. Closing via the browser/gesture back button
  // now behaves like normal navigation instead of being intercepted.
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMobileMenu();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileMenuOpen, closeMobileMenu]);

  const handleLinkClick = () => {
    closeMobileMenu();
  };

  return (
    <AnimatePresence>
      {isMobileMenuOpen && (
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-[140] lg:hidden h-dvh w-screen overflow-hidden"
        >
          <div
            role="button"
            tabIndex={-1}
            aria-label="Close menu"
            onClick={closeMobileMenu}
            className="absolute inset-0 z-0 h-full w-full cursor-pointer bg-charcoal/50 backdrop-blur-[2px] pointer-events-auto"
          />

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

                <motion.div variants={itemVariants}>
                  <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.34em] text-gold">
                    My Account
                  </p>

                  <div className="grid gap-1 border border-beige bg-white p-4">
                    {accountLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={handleLinkClick}
                        className="min-h-[44px] flex items-center justify-between py-2.5 font-subheading text-[18px] tracking-wide text-charcoal/68 transition-colors duration-300 hover:text-maroon"
                      >
                        <span>{link.label}</span>
                        <span className="text-sm text-gold">→</span>
                      </Link>
                    ))}
                  </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.34em] text-gold">
                    Support
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