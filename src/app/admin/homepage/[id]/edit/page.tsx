import { notFound } from 'next/navigation';

import { getHomepageSection } from '@/lib/data/homepage-sections';
import { listCollections } from '@/lib/admin/collections-read';
import HomepageSectionForm from '@/components/admin/homepage/HomepageSectionForm';
import FeaturedCollection from '@/components/home/FeaturedCollection';
import NewArrivalsSection from '@/components/home/NewArrivalsSection';
import BestSellersSection from '@/components/home/BestSellersSection';
import ShopByCategorySection from '@/components/home/ShopByCategorySection';
import type { HomepageSectionKey } from '@/types/database';

export const metadata = { title: 'Edit Homepage Section' };

interface EditHomepageSectionPageProps {
  params: Promise<{ id: string }>;
}

const SECTION_LABELS: Record<HomepageSectionKey, string> = {
  featured_collection: 'Featured Collections',
  new_arrivals: 'New Arrivals',
  best_sellers: 'Best Sellers',
  shop_by_category: 'Shop By Category',
};

export default async function EditHomepageSectionPage({ params }: EditHomepageSectionPageProps) {
  const { id } = await params;

  const { data: section, error } = await getHomepageSection(id);

  if (error || !section) {
    notFound();
  }

  const isFeaturedCollection = section.section_key === 'featured_collection';

  const collectionOptions = isFeaturedCollection
    ? (
        await listCollections({ isActive: true, pageSize: 100 })
      ).data?.rows.map((row) => ({ id: row.id, name: row.name })) ?? []
    : undefined;

  // Genuine reuse of the exact storefront components — not a
  // re-implementation of their rendering/data-fetching — reflecting
  // the section's last-saved config. Updates after each save via
  // `router.refresh()` in the form.
  let preview: React.ReactNode = null;
  switch (section.section_key) {
    case 'featured_collection':
      preview = (
        <FeaturedCollection
          limit={section.item_limit}
          collectionId={section.source_collection_id}
          title={section.title}
          subtitle={section.subtitle}
        />
      );
      break;
    case 'new_arrivals':
      preview = <NewArrivalsSection limit={section.item_limit} title={section.title} subtitle={section.subtitle} />;
      break;
    case 'best_sellers':
      preview = <BestSellersSection limit={section.item_limit} title={section.title} subtitle={section.subtitle} />;
      break;
    case 'shop_by_category':
      preview = (
        <ShopByCategorySection limit={section.item_limit} title={section.title} subtitle={section.subtitle} />
      );
      break;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl text-maroon">{SECTION_LABELS[section.section_key]}</h1>
        <p className="text-charcoal/60 mt-1">Edit how this section appears on the homepage.</p>
      </div>

      <HomepageSectionForm section={section} collectionOptions={collectionOptions} />

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-charcoal">Live preview</h2>
        <p className="text-xs text-charcoal/50">
          Reflects the last saved version of this section. Save changes above to update it.
        </p>
        <div className="rounded-lg border border-charcoal/10 overflow-hidden">
          {preview ?? (
            <div className="p-10 text-center text-sm text-charcoal/50">
              Nothing to preview yet — this section has no matching content.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
