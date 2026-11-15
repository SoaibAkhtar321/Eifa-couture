export function ShopGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-x-2 gap-y-3.5 sm:gap-x-5 sm:gap-y-8 md:grid-cols-3 xl:grid-cols-4"
      role="status"
      aria-label="Loading products"
    >
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="animate-pulse">
          <div className="aspect-[3/4] w-full rounded-xl bg-beige" />
          <div className="mt-3 h-4 w-3/4 rounded bg-beige" />
          <div className="mt-2 h-4 w-1/3 rounded bg-beige" />
        </div>
      ))}
    </div>
  );
}
