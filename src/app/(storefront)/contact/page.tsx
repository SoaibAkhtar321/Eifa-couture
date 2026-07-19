import type { Metadata } from 'next';
import Link from 'next/link';


export const metadata: Metadata = {
  title: 'Contact Us | Eifa Couture',
  description:
    'Contact Eifa Couture for product enquiries, order support, custom requests, and handcrafted Lucknowi Chikankari assistance.',
};

const contactCards = [
  {
    title: 'Order Support',
    description:
      'Need help with sizing, product details, delivery, or an existing order? Reach out to our support team.',
    detail: 'support@eifacouture.com',
    href: 'mailto:support@eifacouture.com',
  },
  {
    title: 'WhatsApp Enquiry',
    description:
      'Ask about product availability, fabric, size guidance, or custom styling suggestions.',
    detail: '+91 00000 00000',
    href: 'https://wa.me/910000000000',
  },
  {
    title: 'Boutique Hours',
    description:
      'Our team usually responds during business hours. Custom and bulk enquiries may take longer.',
    detail: 'Mon - Sat, 11 AM - 7 PM',
    href: '/contact',
  },
];

const enquiryTypes = [
  'Product enquiry',
  'Size guidance',
  'Custom order',
  'Bulk / wholesale enquiry',
  'Order support',
];

export default function ContactPage() {
  return (
    <>

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

              <span className="text-charcoal/70">Contact</span>
            </nav>

            <div className="max-w-2xl">
              <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.3em] text-gold sm:text-xs">
                Get In Touch
              </span>

              <h1 className="font-heading text-4xl leading-tight text-charcoal sm:text-5xl lg:text-6xl">
                Contact Eifa Couture
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-charcoal/55 sm:text-base">
                We are here to help with product details, size guidance, custom
                requests, order support, and handcrafted Chikankari enquiries.
              </p>
            </div>
          </div>
        </section>

        <section className="py-10 sm:py-14 lg:py-20">
          <div className="luxury-container">
            <div className="grid gap-5 md:grid-cols-3">
              {contactCards.map((card) => (
                <article
                  key={card.title}
                  className="border border-beige bg-white p-6 transition-all duration-300 hover:border-gold/50 sm:p-7"
                >
                  <h2 className="font-heading text-2xl text-charcoal">
                    {card.title}
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-charcoal/58">
                    {card.description}
                  </p>

                  <a
                    href={card.href}
                    className="mt-5 inline-flex font-body text-xs uppercase tracking-[0.2em] text-maroon transition-colors hover:text-gold"
                    target={card.href.startsWith('http') ? '_blank' : undefined}
                    rel={
                      card.href.startsWith('http') ? 'noreferrer' : undefined
                    }
                  >
                    {card.detail}
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-cream py-10 sm:py-14 lg:py-20">
          <div className="luxury-container">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
              <div>
                <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.3em] text-gold sm:text-xs">
                  Enquiry Form
                </span>

                <h2 className="font-heading text-4xl leading-tight text-charcoal sm:text-5xl">
                  Tell Us What You Are Looking For
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-charcoal/58 sm:text-base sm:leading-8">
                  This is a demo-ready form. Later, we can connect it with email,
                  WhatsApp, Firebase, or an admin enquiry dashboard.
                </p>

                <div className="mt-7 border border-beige bg-white p-5">
                  <p className="font-body text-[10px] uppercase tracking-[0.24em] text-gold">
                    Common Enquiries
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {enquiryTypes.map((type) => (
                      <span
                        key={type}
                        className="border border-beige bg-ivory px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-charcoal/58"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <form className="space-y-5 border border-beige bg-white p-5 sm:p-7 lg:p-8">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-charcoal/55">
                      Full Name
                    </span>

                    <input
                      type="text"
                      name="name"
                      placeholder="Enter your name"
                      className="w-full border border-beige bg-ivory px-4 py-3 text-sm text-charcoal outline-none transition-colors focus:border-gold"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-charcoal/55">
                      Phone Number
                    </span>

                    <input
                      type="tel"
                      name="phone"
                      placeholder="Your mobile number"
                      className="w-full border border-beige bg-ivory px-4 py-3 text-sm text-charcoal outline-none transition-colors focus:border-gold"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-charcoal/55">
                    Email Address
                  </span>

                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    className="w-full border border-beige bg-ivory px-4 py-3 text-sm text-charcoal outline-none transition-colors focus:border-gold"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-charcoal/55">
                    Enquiry Type
                  </span>

                  <select
                    name="enquiryType"
                    className="w-full border border-beige bg-ivory px-4 py-3 text-sm text-charcoal outline-none transition-colors focus:border-gold"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select enquiry type
                    </option>

                    {enquiryTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-charcoal/55">
                    Message
                  </span>

                  <textarea
                    name="message"
                    rows={5}
                    placeholder="Tell us about your requirement"
                    className="w-full resize-none border border-beige bg-ivory px-4 py-3 text-sm text-charcoal outline-none transition-colors focus:border-gold"
                  />
                </label>

                <button
                  type="button"
                  className="btn-luxury btn-luxury-primary w-full"
                >
                  Send Enquiry Soon
                </button>

                <p className="text-center text-xs leading-6 text-charcoal/45">
                  Form submission is not connected yet. For now, customers can
                  use email or WhatsApp enquiry.
                </p>
              </form>
            </div>
          </div>
        </section>

        <section className="bg-maroon py-12 text-center text-white sm:py-16">
          <div className="luxury-container">
            <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.3em] text-gold sm:text-xs">
              Need Styling Help?
            </span>

            <h2 className="mx-auto max-w-2xl font-heading text-4xl leading-tight sm:text-5xl">
              We Can Help You Choose The Right Piece
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/65 sm:text-base sm:leading-8">
              Explore our handcrafted collection or reach out for product and
              size guidance.
            </p>

            <Link
              href="/shop"
              className="btn-luxury mt-8 inline-flex border border-gold bg-gold px-8 py-4 text-charcoal hover:bg-white"
            >
              Shop Collection
            </Link>
          </div>
        </section>
      </main>

    </>
  );
}