import Header from '@/components/layout/Header';
import CartDrawer from '@/components/ui/CartDrawer';

import HeroSection from '@/components/home/HeroSection';
import FeaturedCollection from '@/components/home/FeaturedCollection';

export default function HomePage() {
  return (
    <>
      <Header />

      <main>
        <HeroSection />
        <FeaturedCollection />
      </main>

      <CartDrawer />
    </>
  );
}