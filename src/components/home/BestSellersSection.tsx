import ProductRail from '@/components/home/ProductRail';
import { createClient } from '@/lib/supabase/server';
import { fetchBestSellers } from '@/lib/data/products';

interface Props {
  limit?: number;
  title?: string | null;
  subtitle?: string | null;
}

export default async function BestSellersSection({ limit = 8, title, subtitle }: Props) {
  const supabase = await createClient();
  const products = await fetchBestSellers(supabase, limit);

  return (
    <ProductRail
      id="bestsellers-heading"
      eyebrow="Most Loved"
      title={title || 'Best Sellers'}
      subtitle={subtitle}
      products={products}
      viewAllHref="/shop?collection=best-sellers"
      viewAllLabel="View all"
    />
  );
}
