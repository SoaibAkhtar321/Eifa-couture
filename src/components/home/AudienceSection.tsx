import ProductRail from '@/components/home/ProductRail';
import { createClient } from '@/lib/supabase/server';
import { fetchProductsInCategories } from '@/lib/data/products';
import { getAudienceSlugs, type Audience } from '@/lib/catalog';
import type { Category } from '@/types';

const COPY: Record<Audience, { eyebrow: string; title: string; text: string; image: string; tone: 'ivory' | 'cream' }> = {
  women: {
    eyebrow: 'For Her',
    title: "Women's Collection",
    text: 'Sarees, kurta sets and suits — hand-embroidered by Lucknow’s master karigars.',
    image: '/images/collections/women.png',
    tone: 'ivory',
  },
  men: {
    eyebrow: 'For Him',
    title: "Men's Collection",
    text: 'Chikankari kurtas in cotton, silk and linen for festive days and every day.',
    image: '/images/collections/men.png',
    tone: 'cream',
  },
};

interface Props {
  audience: Audience;
  categories: Category[];
  limit?: number;
}

export default async function AudienceSection({ audience, categories, limit = 8 }: Props) {
  const slugs = getAudienceSlugs(categories, audience);
  const categoryIds = categories.filter((c) => slugs.has(c.slug)).map((c) => c.id);

  const supabase = await createClient();
  const products = await fetchProductsInCategories(supabase, categoryIds, limit);
  const copy = COPY[audience];
  const href = `/shop?audience=${audience}`;

  if (products.length === 0) return null;

  return (
    <ProductRail
      id={`${audience}-products-heading`}
      eyebrow={copy.eyebrow}
      title={`Latest for ${audience === 'women' ? 'Her' : 'Him'}`}
      products={products}
      viewAllHref={href}
      viewAllLabel="View all"
      tone={copy.tone}
    />
  );
}
