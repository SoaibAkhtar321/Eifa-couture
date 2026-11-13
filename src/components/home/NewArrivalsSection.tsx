import ProductRail from '@/components/home/ProductRail';
import { createClient } from '@/lib/supabase/server';
import { fetchNewArrivals } from '@/lib/data/products';

interface Props {
  limit?: number;
  title?: string | null;
  subtitle?: string | null;
}

export default async function NewArrivalsSection({ limit = 8, title, subtitle }: Props) {
  const supabase = await createClient();
  const products = await fetchNewArrivals(supabase, limit);

  return (
    <ProductRail
      id="new-arrivals-heading"
      eyebrow="Just Arrived"
      title={title || 'New Arrivals'}
      subtitle={subtitle}
      products={products}
      viewAllHref="/shop?collection=new-arrivals"
      viewAllLabel="View all"
      tone="cream"
    />
  );
}
