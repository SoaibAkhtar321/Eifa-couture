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
 * Shows exactly the products toggled "Featured" in the admin. If the
 * admin picks a specific collection for this section in Homepage CMS,
 * that collection's products are shown instead.
 */
export default async function FeaturedCollection({ limit = 8, collectionId = null, title, subtitle }: Props) {
  const supabase = await createClient();

  if (collectionId) {
    const result = await fetchFeaturedCollection(supabase, limit, collectionId);
    if (result) {
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
