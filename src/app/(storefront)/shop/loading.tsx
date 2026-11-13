import { ShopGridSkeleton } from '@/components/shop/ShopGridSkeleton';

export default function ShopLoading() {
  return (
    <main className="bg-ivory">
      <div className="luxury-container py-12 lg:py-16">
        <div className="h-10 w-64 animate-pulse rounded bg-beige" />
        <div className="mt-10">
          <ShopGridSkeleton />
        </div>
      </div>
    </main>
  );
}
