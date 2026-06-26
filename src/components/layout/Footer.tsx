import Link from 'next/link';

const shopLinks = [
  { label: 'New Arrivals', href: '/new-arrivals' },
  { label: 'Best Sellers', href: '/best-sellers' },
  { label: "Women's Kurtas", href: '/shop/womens-kurtas' },
  { label: "Men's Kurtas", href: '/shop/mens-kurtas' },
  { label: 'Sarees', href: '/shop/sarees' },
  { label: 'Bridal Collection', href: '/shop/bridal-collection' },
];

const helpLinks = [
  { label: 'Contact Us', href: '/contact' },
  { label: 'Shipping Policy', href: '/shipping-policy' },
  { label: 'Return Policy', href: '/return-policy' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms & Conditions', href: '/terms' },
];

export default function Footer() {
  return (
    <footer className="bg-charcoal text-white" aria-label="Footer">
      <div className="luxury-container py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block">
              <span className="block font-heading text-3xl tracking-[0.22em] text-white">
                EIFA COUTURE
              </span>
              <span className="mt-1 block font-body text-[10px] uppercase tracking-[0.35em] text-gold">
                Lucknowi Chikankari
              </span>
            </Link>

            <p className="mt-5 max-w-md font-body text-sm leading-relaxed text-white/60">
              Premium handcrafted Lucknowi Chikankari fashion since 1998. Every
              piece celebrates heritage, patience, and the artistry of skilled
              karigars.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {['Instagram', 'Facebook', 'WhatsApp'].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="border border-white/15 px-4 py-2 font-body text-[10px] uppercase tracking-[0.18em] text-white/70 transition-colors hover:border-gold hover:text-gold"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-body text-xs uppercase tracking-[0.25em] text-gold">
              Shop
            </h3>

            <ul className="mt-5 space-y-3">
              {shopLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-body text-sm text-white/65 transition-colors hover:text-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-body text-xs uppercase tracking-[0.25em] text-gold">
              Help
            </h3>

            <ul className="mt-5 space-y-3">
              {helpLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-body text-sm text-white/65 transition-colors hover:text-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-7 border-t border-white/10 pt-5">
              <p className="font-body text-xs uppercase tracking-[0.2em] text-gold">
                Contact
              </p>
              <p className="mt-3 font-body text-sm text-white/60">
                Lucknow, Uttar Pradesh
              </p>
              <p className="mt-1 font-body text-sm text-white/60">
                support@eifacouture.com
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-center md:flex-row md:items-center md:justify-between md:text-left">
          <p className="font-body text-xs text-white/45">
            © {new Date().getFullYear()} Eifa Couture. All rights reserved.
          </p>

          <p className="font-body text-xs uppercase tracking-[0.18em] text-white/35">
            Handcrafted in Lucknow
          </p>
        </div>
      </div>
    </footer>
  );
}