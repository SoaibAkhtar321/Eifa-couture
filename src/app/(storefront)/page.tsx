import type { Metadata } from 'next';
import { Suspense } from 'react';

import HeroSection from '@/components/home/HeroSection';
import FeaturedCollection from '@/components/home/FeaturedCollection';
import NewArrivalsSection from '@/components/home/NewArrivalsSection';
import BestSellersSection from '@/components/home/BestSellersSection';
import ShopByCategorySection from '@/components/home/ShopByCategorySection';
import AudienceSection from '@/components/home/AudienceSection';
import WhyChooseUsSection from '@/components/home/WhyChooseUsSection';
import HeritageSection from '@/components/home/HeritageSection';
import {
  FeaturedCollectionSkeleton,
  NewArrivalsSkeleton,
  BestSellersSkeleton,
  ShopByCategorySkeleton,
} from '@/components/home/HomeSectionSkeletons';
import { getCachedHeroBanner, getCachedHomepageSectionMap } from '@/lib/data/storefront-cache';
import { getAudiencePanelImages } from '@/lib/data/audience-panels';
import type { HomepageSectionKey } from '@/types/database';

export const metadata: Metadata = {
  title: 'Eifa Couture | Premium Lucknowi Chikankari Since 1998',
  description:
    'Discover premium handcrafted Lucknowi Chikankari fashion at Eifa Couture. Explore luxury kurtas, sarees, dupattas, bridal wear, and menswear rooted in Lucknowi heritage.',
};

// The hero is its own async component so the page shell (and the default
// hero) can paint immediately instead of waiting on Supabase.
async function HomeHero() {
  const [heroBanner, panelImages] = await Promise.all([
    getCachedHeroBanner(),
    getAudiencePanelImages(),
  ]);
  return <HeroSection banner={heroBanner} panelImages={panelImages} />;
}

export default function HomePage() {
  return (
    <main>
      <Suspense fallback={<HeroSection />}>
        <HomeHero />
      </Suspense>

      {/* Each data-driven section gets its own Suspense boundary so the
          page streams progressively instead of waiting for every
          Supabase query to resolve before showing anything. */}
      <Suspense fallback={<NewArrivalsSkeleton />}>
        <HomeSections />
      </Suspense>

      <HeritageSection />
      <WhyChooseUsSection />
    </main>
  );
}

async function HomeSections() {
  const sectionMap = await getCachedHomepageSectionMap();

  // Renders in admin-configured `sort_order`; a missing/deleted config
  // row falls back to each component's own defaults rather than being
  // hidden, so the homepage never breaks if the CMS table is empty.
  const managedSections = (
    [
      {
        key: 'featured_collection',
        order: sectionMap.featured_collection?.sort_order ?? 2,
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
        order: sectionMap.new_arrivals?.sort_order ?? 1,
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
    // Shop by Category always leads, right under the trust strip, so
    // shoppers can start browsing at once. The admin can still hide it
    // with its on/off switch; the rest follow in CMS order.
    .sort((a, b) => {
      if (a.key === 'shop_by_category') return -1;
      if (b.key === 'shop_by_category') return 1;
      return a.order - b.order;
    });

  // Women / Men / Accessories sit right after the New Arrivals + Featured
  // block (wherever the admin has put those); the remaining managed
  // sections (Best Sellers, Shop by Category) follow in CMS order.
  const audienceBlock = (
    <>
      <Suspense fallback={<NewArrivalsSkeleton />}>
        <AudienceSection audience="women" />
      </Suspense>
      <Suspense fallback={<NewArrivalsSkeleton />}>
        <AudienceSection audience="men" />
      </Suspense>
      <Suspense fallback={<NewArrivalsSkeleton />}>
        <AudienceSection audience="accessories" />
      </Suspense>
    </>
  );
  const isTopBlock = (key: string) => key === 'new_arrivals' || key === 'featured_collection';
  let lastTopIndex = -1;
  managedSections.forEach((section, index) => {
    if (isTopBlock(section.key)) lastTopIndex = index;
  });

  return (
    <>
      {lastTopIndex === -1 && audienceBlock}
      {managedSections.map((section, index) => (
        <div key={section.key}>
          {section.node}
          {index === lastTopIndex && audienceBlock}
        </div>
      ))}
    </>
  );
}
