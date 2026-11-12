import Link from 'next/link';

import { CONTACT_INFO } from '@/lib/constants';
import { getStoreSettings } from '@/lib/data/store-settings';
import { createClient } from '@/lib/supabase/server';
import { fetchActiveCategories } from '@/lib/data/categories';
import type { Category } from '@/types';

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

function getShopLinks(categories: Category[]): FooterLink[] {
  const categoryLinks = categories.map((category) => ({
    label: category.name,
    href: getCategoryHref(category.slug),
  }));

  return [...collectionLinks, ...categoryLinks];
}

export default async function Footer() {
  const supabase = await createClient();
  const [categories, { data: settings }] = await Promise.all([
    fetchActiveCategories(supabase),
    getStoreSettings(),
  ]);
  // Contact + social details come from Admin → Settings, falling back
  // to defaults only for fields the admin hasn't filled in.
  const email = settings?.store_email || CONTACT_INFO.email;
  const phone = settings?.store_phone || CONTACT_INFO.phone;
  const location =
    [settings?.address_city, settings?.address_state].filter(Boolean).join(', ') || 'Lucknow, Uttar Pradesh';
  const socialLinks = [
    { name: 'Instagram', href: settings?.social_instagram_url },
    { name: 'Facebook', href: settings?.social_facebook_url },
    { name: 'Pinterest', href: settings?.social_pinterest_url },
    { name: 'YouTube', href: settings?.social_youtube_url },
    { name: 'X', href: settings?.social_twitter_url },
  ].filter((link): link is { name: string; href: string } => !!link.href);
  const shopLinks = getShopLinks(categories);
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

            <p className="mt-5 max-w-sm text-sm leading-7 text-ink-soft">
              Premium handcrafted Lucknowi Chikankari fashion since 1998. Every
              piece celebrates heritage, patience, and refined craftsmanship.
            </p>

            {socialLinks.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-beige bg-white px-4 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-ink-soft transition-all duration-300 hover:border-maroon hover:bg-maroon hover:text-white"
                >
                  {link.name}
                </a>
              ))}
            </div>
            )}
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
                    className="font-subheading text-[17px] text-ink-soft transition-colors duration-300 hover:text-maroon"
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
                    className="font-subheading text-[17px] text-ink-soft transition-colors duration-300 hover:text-maroon"
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

            <div className="mt-5 space-y-3 font-subheading text-[17px] text-ink-soft">
              <p>{location}</p>

              <a
                href={`mailto:${email}`}
                className="block transition-colors duration-300 hover:text-maroon"
              >
                {email}
              </a>

              <a
                href={`tel:${phone.replace(/[^+\d]/g, '')}`}
                className="block transition-colors duration-300 hover:text-maroon"
              >
                {phone}
              </a>
            </div>

            <ul className="mt-6 space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs uppercase tracking-[0.22em] text-ink-muted transition-colors duration-300 hover:text-maroon"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-beige py-5 text-xs uppercase tracking-[0.22em] text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {currentYear} Eifa Couture. All rights reserved.</p>
          <p>Handcrafted in Lucknow</p>
        </div>
      </div>
    </footer>
  );
}