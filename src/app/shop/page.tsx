import type { Metadata } from 'next';

import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import ShopPageClient from '@/components/shop/ShopPageClient';
import CartDrawer from '@/components/ui/CartDrawer';

export const metadata: Metadata = {
  title: 'Shop Collection',
  description:
    'Explore Eifa Couture’s premium handcrafted Lucknowi Chikankari collection — kurtas, anarkalis, sarees, dupattas, bridal wear, and menswear.',
};

export default function ShopPage() {
  return (
    <>
      <Header />

      <main>
        <ShopPageClient />
      </main>

      <Footer />
      <CartDrawer />
    </>
  );
}