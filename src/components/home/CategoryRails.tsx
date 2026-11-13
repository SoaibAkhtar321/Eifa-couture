import ProductRail from '@/components/home/ProductRail';
import { createClient } from '@/lib/supabase/server';
import { fetchProductsByAudience } from '@/lib/data/products';
import { expandCategorySlugs, getAudienceRootCategories } from '@/lib/catalog';
import type { Category } from '@/types';

/**
 * One product rail per top-level ACCESSORIES category (silk bags,
 * potlis, dupattas ...). Women/Men categories have their own sections,
 * and only products whose own audience is "accessories" are shown, so
 * nothing else can leak into these rails.
 */
export default async function CategoryRails({ categories, max = 3 }: { categories: Category[]; max?: number }) {
  const roots = getAudienceRootCategories(categories, 'accessories').slice(0, max);
  if (roots.length === 0) return null;

  const supabase = await createClient();
  const rails = await Promise.all(
    roots.map(async (root) => {
      const slugs = expandCategorySlugs(categories, [root.slug]);
      const ids = categories.filter((c) => slugs.has(c.slug)).map((c) => c.id);
      return { root, products: await fetchProductsByAudience(supabase, 'accessories', 8, ids) };
    })
  );

  return (
    <>
      {rails.map(({ root, products }, index) => (
        <ProductRail
          key={root.id}
          id={`category-${root.slug}-heading`}
          eyebrow="Shop the Edit"
          title={root.name}
          subtitle={root.description}
          products={products}
          viewAllHref={`/shop?category=${root.slug}`}
          viewAllLabel="View all"
          tone={index % 2 === 0 ? 'ivory' : 'cream'}
        />
      ))}
    </>
  );
}
