import Link from 'next/link';

import { MOCK_CATEGORIES } from '@/lib/mock-data';

const CATEGORY_IMAGES: Record<string, string> = {
  anarkalis: '/images/categories/anarkali.png',
  'womens-kurtas': '/images/categories/kurtas.png',
  'mens-kurtas': '/images/categories/men-kurtas.png',
  sarees: '/images/categories/sarees.png',
  dupattas: '/images/categories/dupattas.png',
  'palazzo-sets': '/images/categories/palazzo.png',
  'bridal-collection': '/images/categories/bridal.png',
  accessories: '/images/categories/dupattas.png',
};

export default function ShopByCategorySection() {
  const categories = MOCK_CATEGORIES.filter((category) => category.isActive).slice(0, 6);

  return (
    <section className="bg-beige py-10 md:py-16 lg:py-24" aria-labelledby="categories-heading">
      <div className="luxury-container">
        <div className="mb-8 text-center md:mb-12">
          <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.28em] text-gold md:text-xs">
            Explore
          </span>

          <h2
            id="categories-heading"
            className="font-heading text-2xl text-charcoal md:text-5xl lg:text-6xl"
          >
            Shop by Category
          </h2>

          <div className="divider-gold mx-auto mt-4 w-20 md:mt-5 md:w-24" />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:gap-6">
          {categories.map((category) => (
            <article key={category.id} className="group">
              <Link
                href={`/shop/${category.slug}`}
                className="relative block aspect-[4/5] overflow-hidden bg-charcoal"
              >
                <img
                  src={CATEGORY_IMAGES[category.slug] || category.image}
                  alt={category.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/75 via-charcoal/20 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-3 md:p-6">
                  <h3 className="font-heading text-base leading-tight text-white md:text-2xl">
                    {category.name}
                  </h3>

                  <p className="mt-1 hidden max-w-xs font-body text-sm leading-relaxed text-white/75 md:block">
                    {category.description}
                  </p>

                  <div className="mt-2 flex items-center gap-2 text-gold md:mt-3">
                    <span className="font-body text-[10px] uppercase tracking-[0.18em] md:text-xs">
                      Explore
                    </span>

                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      aria-hidden="true"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}