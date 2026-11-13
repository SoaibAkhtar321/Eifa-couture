import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';
import { fetchActiveProducts } from '@/lib/data/products';

const SITE_URL = 'https://eifacouture.com';

const STATIC_PATHS: { path: string; priority: number }[] = [
  { path: '', priority: 1 },
  { path: '/shop', priority: 0.9 },
  { path: '/women', priority: 0.9 },
  { path: '/men', priority: 0.9 },
  { path: '/accessories', priority: 0.9 },
  { path: '/about', priority: 0.5 },
  { path: '/contact', priority: 0.5 },
  { path: '/size-guide', priority: 0.4 },
  { path: '/track-order', priority: 0.3 },
  { path: '/privacy-policy', priority: 0.2 },
  { path: '/refund-policy', priority: 0.2 },
  { path: '/terms', priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    priority,
  }));

  try {
    const supabase = await createClient();
    const products = await fetchActiveProducts(supabase);
    for (const product of products) {
      entries.push({
        url: `${SITE_URL}/product/${product.slug}`,
        priority: 0.8,
      });
    }
  } catch {
    // If the catalogue cannot be read, still serve the static pages.
  }

  return entries;
}
