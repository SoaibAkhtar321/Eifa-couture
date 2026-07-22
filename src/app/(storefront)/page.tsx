import type { Metadata } from 'next';
import { Suspense } from 'react';

import HeroSection from '@/components/home/HeroSection';
import FeaturedCollection from '@/components/home/FeaturedCollection';
import NewArrivalsSection from '@/components/home/NewArrivalsSection';
import BestSellersSection from '@/components/home/BestSellersSection';
import ShopByCategorySection from '@/components/home/ShopByCategorySection';
import WomensCollectionSection from '@/components/home/WomensCollectionSection';
import MensCollectionSection from '@/components/home/MensCollectionSection';
import WhyChooseUsSection from '@/components/home/WhyChooseUsSection';
import HeritageSection from '@/components/home/HeritageSection';
import DynamicHomeSections from '@/components/home/DynamicHomeSections';
import {
  FeaturedCollectionSkeleton,
  NewArrivalsSkeleton,
  BestSellersSkeleton,
  ShopByCategorySkeleton,
} from '@/components/home/HomeSectionSkeletons';
import { getActiveHomepageSectionMap } from '@/lib/data/homepage-sections';
import type { HomepageSectionKey } from '@/types/database';

export const metadata: Metadata = {
  title: 'Eifa Couture | Premium Lucknowi Chikankari Since 1998',
  description:
    'Discover premium handcrafted Lucknowi Chikankari fashion at Eifa Couture. Explore luxury kurtas, sarees, dupattas, bridal wear, and menswear rooted in Lucknowi heritage.',
};

export default async function HomePage() {
  const sectionMap = await getActiveHomepageSectionMap();

  // Renders in admin-configured `sort_order`; a missing/deleted config
  // row falls back to each component's own defaults rather than being
  // hidden, so the homepage never breaks if the CMS table is empty.
  const managedSections = (
    [
      {
        key: 'featured_collection',
        order: sectionMap.featured_collection?.sort_order ?? 1,
        node: (
          <Suspense fallback={<FeaturedCollectionSkeleton />}>
            <FeaturedCollection
              limit={sectionMap.featured_collection?.item_limit}
              collectionId={sectionMap.featured_collection?.source_collection_id}
              title={sectionMap.featured_collection?.title}
              subtitle={sectionMap.featured_collection?.subtitle}
            />
          </Suspense>
        ),
      },
      {
        key: 'new_arrivals',
        order: sectionMap.new_arrivals?.sort_order ?? 2,
        node: (
          <Suspense fallback={<NewArrivalsSkeleton />}>
            <NewArrivalsSection
              limit={sectionMap.new_arrivals?.item_limit}
              title={sectionMap.new_arrivals?.title}
              subtitle={sectionMap.new_arrivals?.subtitle}
            />
          </Suspense>
        ),
      },
      {
        key: 'best_sellers',
        order: sectionMap.best_sellers?.sort_order ?? 3,
        node: (
          <Suspense fallback={<BestSellersSkeleton />}>
            <BestSellersSection
              limit={sectionMap.best_sellers?.item_limit}
              title={sectionMap.best_sellers?.title}
              subtitle={sectionMap.best_sellers?.subtitle}
            />
          </Suspense>
        ),
      },
      {
        key: 'shop_by_category',
        order: sectionMap.shop_by_category?.sort_order ?? 4,
        node: (
          <Suspense fallback={<ShopByCategorySkeleton />}>
            <ShopByCategorySection
              limit={sectionMap.shop_by_category?.item_limit}
              title={sectionMap.shop_by_category?.title}
              subtitle={sectionMap.shop_by_category?.subtitle}
            />
          </Suspense>
        ),
      },
    ] as { key: HomepageSectionKey; order: number; node: React.ReactNode }[]
  )
    .filter((section) => sectionMap[section.key]?.is_active ?? true)
    .sort((a, b) => a.order - b.order);

  return (
    <>
      <main>
        <HeroSection />

        {/* Each data-driven section gets its own Suspense boundary so the
            page streams progressively instead of waiting for every
            Supabase query to resolve before showing anything below the
            hero — independent sections no longer block each other. */}
        {managedSections.map((section) => (
          <div key={section.key}>{section.node}</div>
        ))}

        <WomensCollectionSection />
        <MensCollectionSection />
        <DynamicHomeSections />
        <WhyChooseUsSection />
        <HeritageSection />
      </main>
    </>
  );
}

