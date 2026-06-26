import type { Metadata } from 'next';
import Link from 'next/link';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/ui/CartDrawer';

export const metadata: Metadata = {
  title: 'Size Guide | Eifa Couture',
  description:
    'Find the right size for Eifa Couture handcrafted Chikankari kurtas, sets, sarees, dupattas, and accessories.',
};

const womenSizeGuide = [
  { size: 'XS', bust: '32', waist: '26', hip: '36' },
  { size: 'S', bust: '34', waist: '28', hip: '38' },
  { size: 'M', bust: '36', waist: '30', hip: '40' },
  { size: 'L', bust: '38', waist: '32', hip: '42' },
  { size: 'XL', bust: '40', waist: '34', hip: '44' },
  { size: 'XXL', bust: '42', waist: '36', hip: '46' },
];

const menSizeGuide = [
  { size: 'S', chest: '38', shoulder: '17', length: '40' },
  { size: 'M', chest: '40', shoulder: '18', length: '41' },
  { size: 'L', chest: '42', shoulder: '18.5', length: '42' },
  { size: 'XL', chest: '44', shoulder: '19', length: '43' },
  { size: 'XXL', chest: '46', shoulder: '19.5', length: '44' },
  { size: '3XL', chest: '48', shoulder: '20', length: '45' },
];

const fitTips = [
  {
    title: 'Measure Over Comfortable Clothing',
    description:
      'Use a soft measuring tape and keep it comfortably firm, not too tight.',
  },
  {
    title: 'Check Product Fit',
    description:
      'Some silhouettes are relaxed while others are structured. Always check product description before choosing size.',
  },
  {
    title: 'Between Two Sizes?',
    description:
      'For relaxed ethnic wear, choosing the larger size usually gives better comfort and movement.',
  },
  {
    title: 'Need Help?',
    description:
      'Contact us with your measurements and we can guide you before placing the order.',
  },
];

export default function SizeGuidePage() {
  return (
    <>
      <Header />

      <main className="bg-ivory">
        <section className="border-b border-beige bg-gradient-to-b from-cream/70 to-ivory">
          <div className="luxury-container py-6 sm:py-8 lg:py-12">
            <nav
              aria-label="Breadcrumb"
              className="mb-5 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-charcoal/45 sm:text-[11px]"
            >
              <Link href="/" className="hover:text-maroon">
                Home
              </Link>

              <span>/</span>

              <span className="text-charcoal/70">Size Guide</span>
            </nav>

            <div className="max-w-2xl">
              <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.3em] text-gold sm:text-xs">
                Fit Assistance
              </span>

              <h1 className="font-heading text-4xl leading-tight text-charcoal sm:text-5xl lg:text-6xl">
                Size Guide
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-charcoal/55 sm:text-base">
                Use this guide to choose the right size for kurtas, sets, and
                occasion wear. Measurements are approximate and shown in inches.
              </p>
            </div>
          </div>
        </section>

        <section className="py-10 sm:py-14 lg:py-20">
          <div className="luxury-container">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
              <div className="border border-beige bg-white p-5 sm:p-7">
                <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.28em] text-gold">
                  Women
                </span>

                <h2 className="font-heading text-3xl text-charcoal">
                  Women&apos;s Size Chart
                </h2>

                <div className="mt-6 overflow-x-auto">
                  <table className="w-full min-w-[520px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-beige bg-cream/60">
                        <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-charcoal/55">
                          Size
                        </th>
                        <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-charcoal/55">
                          Bust
                        </th>
                        <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-charcoal/55">
                          Waist
                        </th>
                        <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-charcoal/55">
                          Hip
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {womenSizeGuide.map((row) => (
                        <tr key={row.size} className="border-b border-beige/70">
                          <td className="px-4 py-4 font-heading text-xl text-maroon">
                            {row.size}
                          </td>
                          <td className="px-4 py-4 text-sm text-charcoal/65">
                            {row.bust}
                          </td>
                          <td className="px-4 py-4 text-sm text-charcoal/65">
                            {row.waist}
                          </td>
                          <td className="px-4 py-4 text-sm text-charcoal/65">
                            {row.hip}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border border-beige bg-white p-5 sm:p-7">
                <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.28em] text-gold">
                  Men
                </span>

                <h2 className="font-heading text-3xl text-charcoal">
                  Men&apos;s Size Chart
                </h2>

                <div className="mt-6 overflow-x-auto">
                  <table className="w-full min-w-[520px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-beige bg-cream/60">
                        <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-charcoal/55">
                          Size
                        </th>
                        <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-charcoal/55">
                          Chest
                        </th>
                        <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-charcoal/55">
                          Shoulder
                        </th>
                        <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-charcoal/55">
                          Length
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {menSizeGuide.map((row) => (
                        <tr key={row.size} className="border-b border-beige/70">
                          <td className="px-4 py-4 font-heading text-xl text-maroon">
                            {row.size}
                          </td>
                          <td className="px-4 py-4 text-sm text-charcoal/65">
                            {row.chest}
                          </td>
                          <td className="px-4 py-4 text-sm text-charcoal/65">
                            {row.shoulder}
                          </td>
                          <td className="px-4 py-4 text-sm text-charcoal/65">
                            {row.length}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-4">
              {fitTips.map((tip) => (
                <article
                  key={tip.title}
                  className="border border-beige bg-white p-5 transition-all duration-300 hover:border-gold/50"
                >
                  <h3 className="font-heading text-2xl text-charcoal">
                    {tip.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-charcoal/58">
                    {tip.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-maroon py-12 text-center text-white sm:py-16">
          <div className="luxury-container">
            <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.3em] text-gold sm:text-xs">
              Still Unsure?
            </span>

            <h2 className="mx-auto max-w-2xl font-heading text-4xl leading-tight sm:text-5xl">
              Get Help Choosing Your Size
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/65 sm:text-base sm:leading-8">
              Share your measurements with us and we will help you choose the
              most comfortable fit.
            </p>

            <Link
              href="/contact"
              className="btn-luxury mt-8 inline-flex border border-gold bg-gold px-8 py-4 text-charcoal hover:bg-white"
            >
              Contact Us
            </Link>
          </div>
        </section>
      </main>

      <Footer />
      <CartDrawer />
    </>
  );
}