import ProductRail from '@/components/home/ProductRail';
import { createClient } from '@/lib/supabase/server';
import { fetchProductsByAudience } from '@/lib/data/products';
import type { Audience } from '@/lib/catalog';

const COPY: Record<Audience, { eyebrow: string; title: string; text: string; image: string; tone: 'ivory' | 'cream'; railTitle: string }> = {
  women: {
    eyebrow: 'For Her',
    title: "Women's Collection",
    text: 'Sarees, kurta sets and suits — hand-embroidered by Lucknow’s master karigars.',
    image: '/images/collections/women.png',
    tone: 'ivory',
    railTitle: 'Latest for Her',
  },
  men: {
    eyebrow: 'For Him',
    title: "Men's Collection",
    text: 'Chikankari kurtas in cotton, silk and linen for festive days and every day.',
    image: '/images/collections/men.png',
    tone: 'cream',
    railTitle: 'Latest for Him',
  },
  accessories: {
    eyebrow: 'Finishing Touches',
    title: 'Accessories',
    text: 'Silk bags, potlis, clutches and dupattas to complete the look.',
    image: '',
    tone: 'ivory',
    railTitle: 'Latest Accessories',
  },
};

interface Props {
  audience: Audience;
  limit?: number;
}

export default async function AudienceSection({ audience, limit = 8 }: Props) {
  const supabase = await createClient();
  // Strict, server-side: only products whose own audience matches.
  const products = await fetchProductsByAudience(supabase, audience, limit);
  const copy = COPY[audience];
  const href = `/shop?audience=${audience}`;

  if (products.length === 0) return null;

  return (
    <ProductRail
      id={`${audience}-products-heading`}
      eyebrow={copy.eyebrow}
      title={copy.railTitle}
      products={products}
      viewAllHref={href}
      viewAllLabel="View all"
      tone={copy.tone}
    />
  );
}
