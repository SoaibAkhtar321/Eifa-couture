import Link from 'next/link';

import SectionHeader from '@/components/home/SectionHeader';
import Reveal from '@/components/motion/Reveal';
import { StaggerGroup, StaggerItem } from '@/components/motion/Stagger';
import CategoryImage from '@/components/ui/CategoryImage';
import { createClient } from '@/lib/supabase/server';
import { fetchActiveCategoriesWithImages } from '@/lib/data/categories';

function getCategoryHref(slug: string) {
  return `/shop?category=${slug}`;
}

/**
 * Card sizes for ANY number of categories (1 to 12+). Rows are centred
 * (flex-wrap + justify-center), so a short last row never leaves a hole.
 * Gaps are 12px (mobile), 20px (md) and 24px (lg), matching the classes
 * on the grid; the calc() widths subtract each breakpoint's share of the
 * gaps. Class names are written out in full so Tailwind can see them.
 *
 *   mobile : 2 columns (a single category is one centred card)
 *   tablet : 2 columns for 2 or 4 categories, otherwise 3
 *   desktop: 1-4 categories fill one row, then 3 (5, 6, 9), 5 (10) or 4
 */
function getCategoryGrid(count: number): { container: string; item: string } {
  if (count <= 1) {
    return { container: '', item: 'w-full max-w-[320px]' };
  }

  const base = 'w-[calc(50%-6px)]';
  const md = count === 2 || count === 4 ? 'md:w-[calc(50%-10px)]' : 'md:w-[calc(33.333%-14px)]';

  let lg: string;
  if (count === 2) lg = 'lg:w-[calc(50%-12px)]';
  else if (count === 3 || count === 5 || count === 6 || count === 9) lg = 'lg:w-[calc(33.333%-16px)]';
  else if (count === 10) lg = 'lg:w-[calc(20%-20px)]';
  else lg = 'lg:w-[calc(25%-18px)]';

  return {
    container: count === 2 ? 'mx-auto max-w-3xl' : '',
    item: `${base} ${md} ${lg}`,
  };
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
  const allCategories = await fetchActiveCategoriesWithImages(supabase);
  const topLevel = allCategories.filter((category) => !category.parentId);
  const categories = limit ? topLevel.slice(0, limit) : topLevel;

  if (categories.length === 0) return null;

  const count = categories.length;
  const grid = getCategoryGrid(count);

  return (
    <section
      className="bg-beige py-10 sm:py-12 md:py-14 lg:py-16"
      aria-labelledby="categories-heading"
    >
      <div className="luxury-container">
        <SectionHeader
          id="categories-heading"
          eyebrow="Explore"
          title={title || 'Shop by Category'}
          subtitle={
            subtitle ||
            'Move directly into the collection you are looking for — from handcrafted Chikankari classics to festive accessories.'
          }
        />

        <StaggerGroup className={`flex flex-wrap justify-center gap-3 md:gap-5 lg:gap-6 ${grid.container}`}>
          {categories.map((category, index) => (
            <StaggerItem key={category.id} className={`group ${grid.item}`}>
              <Link
                href={getCategoryHref(category.slug)}
                className="relative block aspect-[4/5] overflow-hidden rounded-2xl bg-charcoal ring-1 ring-gold-deep/30"
                aria-label={`Explore ${category.name}`}
              >
                <CategoryImage
                  src={category.image}
                  name={category.name}
                  priority={index < 2}
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/25 to-transparent" />

                <div className="absolute left-3 top-3 rounded-full border border-white/20 bg-white/15 px-3 py-1 backdrop-blur-sm md:left-5 md:top-5">
                  <span className="font-body text-[9px] font-medium uppercase tracking-[0.2em] text-white md:text-[10px]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-3 md:p-6">
                  <h3 className="font-heading text-[22px] leading-tight text-white md:text-3xl">
                    {category.name}
                  </h3>

                  <p className="mt-2 line-clamp-2 max-w-xs font-body text-xs leading-5 text-white/90 md:text-sm md:leading-relaxed">
                    {category.description}
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-gold-light md:mt-4">
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
            </StaggerItem>
          ))}
        </StaggerGroup>

        <Reveal className="mt-8 flex justify-center md:mt-10">
          <Link href="/shop" className="btn-luxury btn-luxury-secondary">
            View All Collections
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
