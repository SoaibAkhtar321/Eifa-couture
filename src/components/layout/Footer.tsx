import Link from 'next/link';

import { SOCIAL_LINKS } from '@/lib/constants';
import { MOCK_CATEGORIES } from '@/lib/mock-data';

type FooterLink = {
  label: string;
  href: string;
};

const collectionLinks: FooterLink[] = [
  { label: 'New Arrivals', href: '/shop?collection=new-arrivals' },
  { label: 'Best Sellers', href: '/shop?collection=best-sellers' },
];

const helpLinks: FooterLink[] = [
  { label: 'Contact Us', href: '/contact' },
  { label: 'Size Guide', href: '/size-guide' },
  { label: 'Track Order', href: '/track-order' },
  { label: 'Wishlist', href: '/wishlist' },
  { label: 'My Account', href: '/account' },
];

const legalLinks: FooterLink[] = [
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Refund Policy', href: '/refund-policy' },
];

function getCategoryHref(slug: string) {
  return `/shop?category=${slug}`;
}

function getShopLinks(): FooterLink[] {
  const categoryLinks = MOCK_CATEGORIES.filter((category) => category.isActive)
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((category) => ({
      label: category.name,
      href: getCategoryHref(category.slug),
    }));

  return [...collectionLinks, ...categoryLinks];
}

export default function Footer() {
  const shopLinks = getShopLinks();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-beige bg-ivory">
      <div className="luxury-container">
        <div className="grid gap-10 py-12 sm:py-14 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-12 lg:py-16">
          <div>
            <Link href="/" className="inline-flex flex-col">
              <span className="font-heading text-2xl tracking-[0.22em] text-charcoal">
                EIFA COUTURE
              </span>

              <span className="mt-1 font-subheading text-[11px] uppercase tracking-[0.34em] text-gold">
                Lucknowi Chikankari
              </span>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-7 text-charcoal/60">
              Premium handcrafted Lucknowi Chikankari fashion since 1998. Every
              piece celebrates heritage, patience, and refined craftsmanship.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {SOCIAL_LINKS.slice(0, 3).map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="border border-beige bg-white px-4 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-charcoal/60 transition-all duration-300 hover:border-maroon hover:bg-maroon hover:text-white"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-body text-xs font-semibold uppercase tracking-[0.28em] text-charcoal">
              Shop
            </h3>

            <ul className="mt-5 space-y-3">
              {shopLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-subheading text-[17px] text-charcoal/60 transition-colors duration-300 hover:text-maroon"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-body text-xs font-semibold uppercase tracking-[0.28em] text-charcoal">
              Help
            </h3>

            <ul className="mt-5 space-y-3">
              {helpLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-subheading text-[17px] text-charcoal/60 transition-colors duration-300 hover:text-maroon"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-body text-xs font-semibold uppercase tracking-[0.28em] text-charcoal">
              Contact
            </h3>

            <div className="mt-5 space-y-3 font-subheading text-[17px] text-charcoal/60">
              <p>Lucknow, Uttar Pradesh</p>

              <a
                href="mailto:support@eifacouture.com"
                className="block transition-colors duration-300 hover:text-maroon"
              >
                support@eifacouture.com
              </a>

              <a
                href="tel:+919876543210"
                className="block transition-colors duration-300 hover:text-maroon"
              >
                +91 98765 43210
              </a>
            </div>

            <ul className="mt-6 space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs uppercase tracking-[0.22em] text-charcoal/45 transition-colors duration-300 hover:text-maroon"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-beige py-5 text-xs uppercase tracking-[0.22em] text-charcoal/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {currentYear} Eifa Couture. All rights reserved.</p>
          <p>Handcrafted in Lucknow</p>
        </div>
      </div>
    </footer>
  );
}