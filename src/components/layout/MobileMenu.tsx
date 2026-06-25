'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, type Variants } from 'framer-motion';

import { NAV_LINKS, SOCIAL_LINKS } from '@/lib/constants';
import { useUIStore } from '@/store/ui-store';

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.25, delay: 0.1 },
  },
};

const panelVariants: Variants = {
  hidden: { x: '100%' },
  visible: {
    x: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
  exit: {
    x: '100%',
    transition: {
      duration: 0.35,
      ease: 'easeInOut',
    },
  },
};

const listVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

function SocialIcon({ name }: { name: string }) {
  switch (name) {
    case 'instagram':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'facebook':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      );
    case 'pinterest':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.43z" />
          <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'whatsapp':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function MobileMenu() {
  const isMobileMenuOpen = useUIStore((state) => state.isMobileMenuOpen);
  const closeMobileMenu = useUIStore((state) => state.closeMobileMenu);

  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const handleToggleAccordion = (label: string) => {
    setExpandedItem((current) => (current === label ? null : label));
  };

  const handleLinkClick = () => {
    closeMobileMenu();
    setExpandedItem(null);
  };

  return (
    <AnimatePresence>
      {isMobileMenuOpen && (
        <>
          <motion.div
            key="mobile-backdrop"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[90] bg-charcoal/40 backdrop-blur-sm"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />

          <motion.div
            key="mobile-panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed bottom-0 right-0 top-0 z-[100] flex w-full max-w-[420px] flex-col bg-ivory shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
          >
            <div className="flex items-center justify-between border-b border-beige px-6 py-5">
              <div>
                <p className="font-heading text-lg tracking-widest text-charcoal">
                  EIFA COUTURE
                </p>
                <p className="mt-0.5 font-subheading text-[11px] uppercase tracking-[0.25em] text-gold">
                  Lucknowi Chikankari
                </p>
              </div>

              <button
                onClick={closeMobileMenu}
                className="-mr-2 p-2 text-charcoal/60 transition-colors hover:text-charcoal"
                aria-label="Close menu"
                type="button"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-6 py-4">
              <motion.ul
                variants={listVariants}
                initial="hidden"
                animate="visible"
                className="space-y-1"
              >
                {NAV_LINKS.map((link) => (
                  <motion.li key={link.label} variants={itemVariants}>
                    {link.children ? (
                      <div>
                        <button
                          onClick={() => handleToggleAccordion(link.label)}
                          className="flex w-full items-center justify-between py-3.5 font-body text-[15px] uppercase tracking-wide text-charcoal transition-colors hover:text-maroon"
                          aria-expanded={expandedItem === link.label}
                          type="button"
                        >
                          <span>{link.label}</span>
                          <motion.svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            animate={{ rotate: expandedItem === link.label ? 180 : 0 }}
                            transition={{ duration: 0.25 }}
                            className="text-gold"
                            aria-hidden="true"
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </motion.svg>
                        </button>

                        <AnimatePresence>
                          {expandedItem === link.label && (
                            <motion.ul
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: 'easeInOut' }}
                              className="overflow-hidden border-l border-gold/20 pl-4"
                            >
                              {link.children.map((child) => (
                                <li key={child.href}>
                                  <Link
                                    href={child.href}
                                    onClick={handleLinkClick}
                                    className="block py-2.5 font-subheading text-[15px] tracking-wide text-charcoal/70 transition-colors hover:text-maroon"
                                  >
                                    {child.label}
                                  </Link>
                                </li>
                              ))}
                            </motion.ul>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <Link
                        href={link.href}
                        onClick={handleLinkClick}
                        className="block py-3.5 font-body text-[15px] uppercase tracking-wide text-charcoal transition-colors hover:text-maroon"
                      >
                        {link.label}
                      </Link>
                    )}
                  </motion.li>
                ))}
              </motion.ul>
            </nav>

            <div className="space-y-5 border-t border-beige px-6 py-6">
              <div className="flex items-center gap-5">
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-charcoal/40 transition-colors duration-300 hover:text-maroon"
                    aria-label={social.name}
                  >
                    <SocialIcon name={social.icon} />
                  </a>
                ))}
              </div>

              <p className="font-subheading text-xs uppercase tracking-wider text-charcoal/40">
                Since 1998 · Lucknow, India
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}