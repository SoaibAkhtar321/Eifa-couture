const USP_DATA = [
  {
    title: 'Handcrafted Artistry',
    description:
      'Every piece is carefully finished by skilled karigars with patient hand embroidery and refined detailing.',
    icon: (
      <svg
        width="34"
        height="34"
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M24 4C13 4 4 13 4 24s9 20 20 20 20-9 20-20S35 4 24 4z" />
        <path d="M24 14c-3 0-6 2-6 5 0 4 6 4 6 8 0 2-2 3-4 3" />
        <circle cx="24" cy="34" r="1" fill="currentColor" />
        <path d="M16 20s-2-3 0-6M32 20s2-3 0-6" />
        <path d="M18 16c2-3 5-5 6-5s4 2 6 5" />
      </svg>
    ),
  },
  {
    title: 'Premium Fabrics',
    description:
      'Only selected Chanderi silk, muslin cotton, georgette, organza, and breathable festive fabrics make it to our collections.',
    icon: (
      <svg
        width="34"
        height="34"
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 8h32v32H8z" />
        <path d="M8 8l16 16M24 24l16-16M8 40l16-16M24 24l16 16" />
        <path d="M8 24h32M24 8v32" />
      </svg>
    ),
  },
  {
    title: 'Comfort Fit',
    description:
      'Our silhouettes are designed for graceful movement, easy styling, and all-day comfort across occasions.',
    icon: (
      <svg
        width="34"
        height="34"
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 6h16l6 10-6 26H16L10 16 16 6z" />
        <path d="M18 6c1.5 4 4 6 6 6s4.5-2 6-6" />
        <path d="M14 18h20" />
        <path d="M18 30h12" />
      </svg>
    ),
  },
  {
    title: 'Secure Packaging',
    description:
      'Each order is neatly checked, folded, and packed with care so your piece reaches you safely.',
    icon: (
      <svg
        width="34"
        height="34"
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 16l16-8 16 8v20l-16 8-16-8V16z" />
        <path d="M8 16l16 8 16-8" />
        <path d="M24 24v20" />
        <path d="M16 12l16 8" />
      </svg>
    ),
  },
  {
    title: 'Easy Exchange',
    description:
      'Enjoy a simple exchange experience if the size or fit does not feel right after delivery.',
    icon: (
      <svg
        width="34"
        height="34"
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 20l8-8 8 8" />
        <path d="M12 12v16c0 6 4 10 12 10s12-4 12-10V12" />
        <path d="M44 28l-8 8-8-8" />
      </svg>
    ),
  },
  {
    title: 'Secure Payments',
    description:
      'Shop with confidence through secure payment handling and clear order communication.',
    icon: (
      <svg
        width="34"
        height="34"
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="4" y="16" width="40" height="24" rx="4" />
        <path d="M24 28v4M20 28v4M28 28v4" />
        <path d="M16 16V12a8 8 0 0116 0v4" />
      </svg>
    ),
  },
];

export default function WhyChooseUsSection() {
  return (
    <section
      className="bg-cream py-10 md:py-16 lg:py-24"
      aria-labelledby="why-choose-heading"
    >
      <div className="luxury-container">
        <div className="mb-8 text-center md:mb-12">
          <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.28em] text-gold md:text-xs">
            The Eifa Promise
          </span>

          <h2
            id="why-choose-heading"
            className="font-heading text-3xl text-charcoal md:text-5xl"
          >
            Why Choose Us
          </h2>

          <div className="divider-gold mx-auto mt-4 w-20 md:mt-5 md:w-24" />

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-charcoal/55 md:text-base md:leading-8">
            A luxury shopping experience built around craftsmanship, quality,
            comfort, and careful delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
          {USP_DATA.map((usp) => (
            <article
              key={usp.title}
              className="group relative overflow-hidden border border-beige bg-white p-5 text-center transition-all duration-300 hover:border-gold/40 md:p-8"
            >
              <div className="absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center text-gold transition-transform duration-300 group-hover:scale-105 md:mb-5 md:h-14 md:w-14">
                {usp.icon}
              </div>

              <h3 className="mb-2 font-heading text-xl text-charcoal md:text-2xl">
                {usp.title}
              </h3>

              <p className="font-body text-sm leading-relaxed text-charcoal/60">
                {usp.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}