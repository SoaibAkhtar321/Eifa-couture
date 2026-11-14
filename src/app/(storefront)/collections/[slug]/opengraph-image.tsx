import { OG_CONTENT_TYPE, OG_SIZE, renderBrandOg } from '@/lib/og/brand-og';
import { fetchCollectionPageBySlug } from '@/lib/data/collections';
import { createClient } from '@/lib/supabase/server';

export const alt = 'Eifa Couture collection';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let name = 'Collection';
  try {
    const supabase = await createClient();
    const result = await fetchCollectionPageBySlug(supabase, slug, 1);
    if (result) name = result.collection.name;
  } catch {
    // Fall back to the generic card rather than failing the preview.
  }
  return renderBrandOg({ eyebrow: 'Collection', title: name });
}
