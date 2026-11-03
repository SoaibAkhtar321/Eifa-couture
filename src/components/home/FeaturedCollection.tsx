import ProductRail from '@/components/home/ProductRail';
import { createClient } from '@/lib/supabase/server';
import { fetchFeaturedCollection } from '@/lib/data/collections';
import { fetchFeaturedProducts } from '@/lib/data/products';

interface Props {
  limit?: number;
  collectionId?: string | null;
  title?: string | null;
  subtitle?: string | null;
}

/**
 * Uses the collection chosen in Homepage CMS (or the active featured
 * collection). When no collection is set up, falls back to products
 * the admin toggled "Featured" so that toggle always has an effect.
 */
export default async function FeaturedCollection({ limit = 8, collectionId = null, title, subtitle }: Props) {
  const supabase = await createClient();
  const result = await fetchFeaturedCollection(supabase, limit, collectionId);

  if (result && result.products.length > 0) {
    return (
      <ProductRail
        id="featured-heading"
        eyebrow="Curated for You"
        title={title || result.collection.name}
        subtitle={subtitle || result.collection.description}
        products={result.products}
        viewAllHref="/shop?collection=featured"
        viewAllLabel="View all"
      />
    );
  }

  const products = await fetchFeaturedProducts(supabase, limit);

  return (
    <ProductRail
      id="featured-heading"
      eyebrow="Curated for You"
      title={title || 'Featured'}
      subtitle={subtitle}
      products={products}
      viewAllHref="/shop?collection=featured"
      viewAllLabel="View all"
    />
  );
}
