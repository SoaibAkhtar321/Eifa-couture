import Header from '@/components/layout/Header';
import CartDrawer from '@/components/ui/CartDrawer';

import HeroSection from '@/components/home/HeroSection';
import FeaturedCollection from '@/components/home/FeaturedCollection';
import NewArrivalsSection from '@/components/home/NewArrivalsSection';
import BestSellersSection from '@/components/home/BestSellersSection';
import ShopByCategorySection from '@/components/home/ShopByCategorySection';
import WomensCollectionSection from '@/components/home/WomensCollectionSection';
import MensCollectionSection from '@/components/home/MensCollectionSection';
import WhyChooseUsSection from '@/components/home/WhyChooseUsSection';
import HeritageSection from '@/components/home/HeritageSection';
import Footer from '@/components/layout/Footer';

export default function HomePage() {
  return (
    <>
      <Header />

      <main>
        <HeroSection />
        <FeaturedCollection />
        <NewArrivalsSection />
        <BestSellersSection />
        <ShopByCategorySection />
        <WomensCollectionSection />
        <MensCollectionSection />
        <WhyChooseUsSection />
        <HeritageSection />
      </main>
      <Footer />

      
      <CartDrawer />
    </>
  );
}