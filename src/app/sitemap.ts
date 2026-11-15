import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';
import { fetchActiveCollectionSlugs } from '@/lib/data/collections';
import { fetchActiveProducts } from '@/lib/data/products';
import { SITE_URL } from '@/lib/constants';

const STATIC_PATHS: { path: string; priority: number }[] = [
  { path: '', priority: 1 },
  { path: '/shop', priority: 0.9 },
  { path: '/women', priority: 0.9 },
  { path: '/men', priority: 0.9 },
  { path: '/accessories', priority: 0.9 },
  { path: '/about', priority: 0.5 },
  { path: '/contact', priority: 0.5 },
  { path: '/size-guide', priority: 0.4 },
  { path: '/privacy-policy', priority: 0.2 },
  { path: '/shipping-policy', priority: 0.3 },
  { path: '/refund-policy', priority: 0.3 },
  { path: '/terms', priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    priority,
  }));

  try {
    const supabase = await createClient();
    const [products, collectionSlugs] = await Promise.all([
      fetchActiveProducts(supabase),
      fetchActiveCollectionSlugs(supabase),
    ]);
    for (const slug of collectionSlugs) {
      entries.push({ url: `${SITE_URL}/collections/${slug}`, priority: 0.7 });
    }
    for (const product of products) {
      entries.push({
        url: `${SITE_URL}/product/${product.slug}`,
        lastModified: product.updatedAt ? new Date(product.updatedAt) : undefined,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  } catch {
    // If the catalogue cannot be read, still serve the static pages.
  }

  return entries;
}
