import ComingSoonPanel from '@/components/home/ComingSoonPanel';
import ProductRail from '@/components/home/ProductRail';
import { createClient } from '@/lib/supabase/server';
import { fetchProductsByAudience } from '@/lib/data/products';
import type { Audience } from '@/lib/catalog';

type Tone = 'ivory' | 'cream' | 'parchment' | 'dark';

const COPY: Record<
  Audience,
  {
    eyebrow: string;
    title: string;
    tagline: string;
    tone: Tone;
    image: string;
    imageAlt: string;
    emptyTitle: string;
    emptyText: string;
  }
> = {
  women: {
    eyebrow: 'For Her',
    title: "Women's Collection",
    tagline: 'A canvas of Lucknowi artistry',
    tone: 'ivory',
    image: '/images/collections/women.png',
    imageAlt: 'Model in a maroon hand-embroidered Chikankari anarkali',
    emptyTitle: "New women's styles are on their way",
    emptyText: 'Sarees, kurta sets and suits hand-embroidered by our karigars. Fresh pieces land here soon.',
  },
  men: {
    eyebrow: 'For Him',
    title: "Men's Collection",
    tagline: 'Understated, timeless, refined',
    tone: 'dark',
    image: '/images/collections/men.png',
    imageAlt: 'Model in an ivory Chikankari kurta',
    emptyTitle: "New men's kurtas are on their way",
    emptyText: 'Chikankari kurtas in cotton, silk and linen for festive days and every day. Fresh pieces land here soon.',
  },
  accessories: {
    eyebrow: 'The Finishing Touch',
    title: 'Bags & Accessories',
    tagline: 'Silk potlis, clutches and dupattas',
    tone: 'parchment',
    image: '/images/categories/dupattas.png',
    imageAlt: 'Hand-embroidered silk dupattas and accessories',
    emptyTitle: 'New accessories are on their way',
    emptyText: 'Silk bags, potlis, clutches and dupattas to complete every look. Fresh pieces land here soon.',
  },
};

interface Props {
  audience: Audience;
  limit?: number;
}

/**
 * One homepage section per audience. Always renders: with products it
 * is a product rail, without them a "coming soon" panel — so Women,
 * Men and Accessories never disappear. Products are filtered strictly
 * on `products.audience`, server-side.
 */
export default async function AudienceSection({ audience, limit = 8 }: Props) {
  const supabase = await createClient();
  const products = await fetchProductsByAudience(supabase, audience, limit);
  const copy = COPY[audience];
  const href = `/shop?audience=${audience}`;

  return (
    <ProductRail
      id={`${audience}-products-heading`}
      eyebrow={copy.eyebrow}
      title={copy.title}
      subtitle={copy.tagline}
      products={products}
      viewAllHref={href}
      viewAllLabel="View all"
      tone={copy.tone}
      emptyState={
        <ComingSoonPanel
          title={copy.emptyTitle}
          text={copy.emptyText}
          image={copy.image}
          imageAlt={copy.imageAlt}
          href="/shop"
          ctaLabel="Browse the full collection"
        />
      }
    />
  );
}
