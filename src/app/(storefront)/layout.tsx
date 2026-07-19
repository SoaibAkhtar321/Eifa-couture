import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/ui/CartDrawer';
import CartSyncProvider from '@/providers/CartSyncProvider';
import WishlistSyncProvider from '@/providers/WishlistSyncProvider';

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartSyncProvider>
      <WishlistSyncProvider>
        <div className="relative flex min-h-screen flex-col overflow-x-hidden">
          <Header />

          <div className="flex-1 w-full relative z-10">{children}</div>

          <Footer />
          <CartDrawer />
        </div>
      </WishlistSyncProvider>
    </CartSyncProvider>
  );
}