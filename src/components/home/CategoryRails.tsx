import ProductRail from '@/components/home/ProductRail';
import { createClient } from '@/lib/supabase/server';
import { fetchProductsInCategories } from '@/lib/data/products';
import { expandCategorySlugs, getAudienceRootSlugs } from '@/lib/catalog';
import type { Category } from '@/types';

/**
 * One product rail per remaining top-level category (e.g. Bags &
 * Accessories) — anything the admin adds shows up automatically.
 * Women/Men categories are skipped because they have their own section.
 */
export default async function CategoryRails({ categories, max = 3 }: { categories: Category[]; max?: number }) {
  const audienceRoots = new Set([
    ...getAudienceRootSlugs(categories, 'women'),
    ...getAudienceRootSlugs(categories, 'men'),
  ]);
  const roots = categories.filter((c) => !c.parentId && !audienceRoots.has(c.slug)).slice(0, max);
  if (roots.length === 0) return null;

  const supabase = await createClient();
  const rails = await Promise.all(
    roots.map(async (root) => {
      const slugs = expandCategorySlugs(categories, [root.slug]);
      const ids = categories.filter((c) => slugs.has(c.slug)).map((c) => c.id);
      return { root, products: await fetchProductsInCategories(supabase, ids, 8) };
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
