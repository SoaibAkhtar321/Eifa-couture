import Link from 'next/link';

import ProductImage from '@/components/ui/ProductImage';
import { createClient } from '@/lib/supabase/server';
import { fetchActiveCategories } from '@/lib/data/categories';

function getCategoryHref(slug: string) {
  return `/shop?category=${slug}`;
}

interface ShopByCategorySectionProps {
  limit?: number;
  title?: string | null;
  subtitle?: string | null;
}

export default async function ShopByCategorySection({
  limit,
  title,
  subtitle,
}: ShopByCategorySectionProps = {}) {
  const supabase = await createClient();
  const allCategories = await fetchActiveCategories(supabase);
  const categories = limit ? allCategories.slice(0, limit) : allCategories;

  if (categories.length === 0) return null;

  return (
    <section
      className="bg-beige py-10 sm:py-12 md:py-16 lg:py-24"
      aria-labelledby="categories-heading"
    >
      <div className="luxury-container">
        <div className="mb-8 flex flex-col gap-4 text-center md:mb-12 md:items-center">
          <div>
            <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.28em] text-gold md:text-xs">
              Explore
            </span>

            <h2
              id="categories-heading"
              className="font-heading text-3xl leading-tight text-charcoal md:text-5xl lg:text-6xl"
            >
              {title || 'Shop by Category'}
            </h2>

            <div className="divider-gold mx-auto mt-4 w-20 md:mt-5 md:w-24" />
          </div>

          <p className="mx-auto max-w-xl text-sm leading-7 text-charcoal/55 md:text-base md:leading-8">
            {subtitle ||
              'Move directly into the collection you are looking for — from handcrafted Chikankari classics to festive accessories.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {categories.map((category, index) => (
            <article key={category.id} className="group">
              <Link
                href={getCategoryHref(category.slug)}
                className="relative block aspect-[4/5] overflow-hidden bg-charcoal"
                aria-label={`Explore ${category.name}`}
              >
                <ProductImage
                  src={category.image}
                  alt={category.name}
                  fill
                  priority={index < 2}
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/25 to-transparent" />

                <div className="absolute left-3 top-3 rounded-full border border-white/20 bg-white/15 px-3 py-1 backdrop-blur-sm md:left-5 md:top-5">
                  <span className="font-body text-[9px] font-medium uppercase tracking-[0.2em] text-white/85 md:text-[10px]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-3 md:p-6">
                  <h3 className="font-heading text-[22px] leading-tight text-white md:text-3xl">
                    {category.name}
                  </h3>

                  <p className="mt-2 line-clamp-2 max-w-xs font-body text-xs leading-5 text-white/72 md:text-sm md:leading-relaxed">
                    {category.description}
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-gold md:mt-4">
                    <span className="font-body text-[10px] uppercase tracking-[0.2em] md:text-xs">
                      Explore
                    </span>

                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-8 flex justify-center md:mt-10">
          <Link href="/shop" className="btn-luxury btn-luxury-secondary">
            View All Collections
          </Link>
        </div>
      </div>
    </section>
  );
}
