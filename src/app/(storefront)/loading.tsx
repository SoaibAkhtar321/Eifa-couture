/* Route-level loading UI that lives INSIDE the storefront layout, so the
   header and bottom navigation stay on screen and tapping a tab gives
   instant feedback while the next page loads. (The root app/loading.tsx
   sits above the layout and used to leave the old page frozen, which is
   why bottom-nav taps felt dead.) */
export default function StorefrontLoading() {
  return (
    <main className="bg-ivory" aria-busy="true">
      <div className="luxury-container py-6 lg:py-12">
        <div className="h-48 w-full animate-pulse rounded-2xl bg-beige/70 sm:h-64" />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-[3/4] animate-pulse rounded bg-beige/70" />
              <div className="mt-3 h-3 w-3/4 animate-pulse rounded bg-beige/70" />
              <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-beige/70" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
