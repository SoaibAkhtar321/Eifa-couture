import ScrollToTopOnMount from '@/components/layout/ScrollToTopOnMount';

/* Shown while a product page loads. It is shaped like a product page (photo on
   the left, details on the right) and resets scroll to the top straight away,
   so a shopper who clicked a product far down a long list never lands on the
   footer while the page is loading. */
export default function ProductLoading() {
  return (
    <main className="bg-ivory" aria-busy="true">
      <ScrollToTopOnMount />
      <div className="luxury-container py-6 lg:py-12">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
          <div className="aspect-[4/5] w-full animate-pulse rounded-2xl bg-beige/70" />
          <div className="space-y-4">
            <div className="h-4 w-1/3 animate-pulse rounded bg-beige/70" />
            <div className="h-8 w-3/4 animate-pulse rounded bg-beige/70" />
            <div className="h-6 w-1/4 animate-pulse rounded bg-beige/70" />
            <div className="h-24 w-full animate-pulse rounded bg-beige/70" />
            <div className="h-12 w-full animate-pulse rounded bg-beige/70" />
          </div>
        </div>
      </div>
    </main>
  );
}
