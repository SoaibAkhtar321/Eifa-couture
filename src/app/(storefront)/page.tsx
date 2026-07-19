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

export const metadata: Metadata = {
  title: 'Eifa Couture | Premium Lucknowi Chikankari Since 1998',
  description:
    'Discover premium handcrafted Lucknowi Chikankari fashion at Eifa Couture. Explore luxury kurtas, sarees, dupattas, bridal wear, and menswear rooted in Lucknowi heritage.',
};

export default function HomePage() {
  return (
    <>
      <main>
        <HeroSection />

        {/* Each data-driven section gets its own Suspense boundary so the
            page streams progressively instead of waiting for every
            Supabase query to resolve before showing anything below the
            hero — independent sections no longer block each other. */}
        <Suspense fallback={<FeaturedCollectionSkeleton />}>
          <FeaturedCollection />
        </Suspense>

        <Suspense fallback={<NewArrivalsSkeleton />}>
          <NewArrivalsSection />
        </Suspense>

        <Suspense fallback={<BestSellersSkeleton />}>
          <BestSellersSection />
        </Suspense>

        <Suspense fallback={<ShopByCategorySkeleton />}>
          <ShopByCategorySection />
        </Suspense>

        <WomensCollectionSection />
        <MensCollectionSection />
        <DynamicHomeSections />
        <WhyChooseUsSection />
        <HeritageSection />
      </main>
    </>
  );
}
