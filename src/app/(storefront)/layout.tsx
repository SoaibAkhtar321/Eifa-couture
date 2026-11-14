import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getCachedMenuCollections } from '@/lib/data/storefront-cache';
import CartDrawer from '@/components/ui/CartDrawer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import RouteOverlayReset from '@/components/layout/RouteOverlayReset';
import CartSyncProvider from '@/providers/CartSyncProvider';
import WishlistSyncProvider from '@/providers/WishlistSyncProvider';

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menuCollections = await getCachedMenuCollections().catch(() => []);
  const extraLinks = menuCollections.map((c) => ({ label: c.name, href: `/collections/${c.slug}` }));

  return (
    <CartSyncProvider>
      <WishlistSyncProvider>
        <div className="relative flex min-h-screen flex-col overflow-x-clip">
          <RouteOverlayReset />
          <Header extraLinks={extraLinks} />

          <div className="flex-1 w-full relative z-10">{children}</div>

          <Footer extraLinks={extraLinks} />
          <MobileBottomNav />
          <CartDrawer />
        </div>
      </WishlistSyncProvider>
    </CartSyncProvider>
  );
}