/* ============================================
   EIFA COUTURE — Home Section Skeletons
   ============================================
   Suspense fallbacks for the async homepage sections. Each mirrors the
   real section's heading copy exactly (so nothing "jumps" when data
   resolves) and only the product/category grid is replaced with the
   existing `.shimmer` placeholder — no new visual language introduced.
   ============================================ */

interface ProductCardSkeletonProps {
  /** Extra classes to layer on the outer article (e.g. aspect helpers). */
  className?: string;
}

export function ProductCardSkeleton({ className = '' }: ProductCardSkeletonProps) {
  return (
    <div className={`flex h-full flex-col overflow-hidden bg-white ${className}`}>
      <div className="shimmer aspect-[4/5] w-full" aria-hidden="true" />

      <div className="flex flex-grow flex-col gap-2 px-2.5 py-3 md:p-5">
        <div className="shimmer h-2.5 w-1/3" aria-hidden="true" />
        <div className="shimmer h-4 w-4/5" aria-hidden="true" />
        <div className="shimmer mt-2 h-4 w-1/2 md:mt-4" aria-hidden="true" />
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  headingId,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  headingId: string;
}) {
  return (
    <div className="mb-8 text-center md:mb-12">
      <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.28em] text-gold md:text-xs">
        {eyebrow}
      </span>

      <h2
        id={headingId}
        className="font-heading text-2xl text-charcoal md:text-5xl lg:text-6xl"
      >
        {title}
      </h2>

      <div className="divider-gold mx-auto mt-4 w-20 md:mt-5 md:w-24" />

      <p className="mx-auto mt-4 max-w-xl font-subheading text-base italic text-charcoal/60 md:text-xl">
        {subtitle}
      </p>
    </div>
  );
}

export function FeaturedCollectionSkeleton() {
  return (
    <section className="bg-ivory py-10 md:py-16 lg:py-24" aria-hidden="true">
      <div className="luxury-container">
        <SectionHeading
          headingId="featured-heading-skeleton"
          eyebrow="Curated for You"
          title="Featured Collection"
          subtitle="Handpicked masterpieces that define the art of Lucknowi Chikankari"
        />

        <div className="grid grid-cols-2 gap-x-2.5 gap-y-5 sm:gap-x-5 sm:gap-y-8 lg:grid-cols-4 lg:gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function NewArrivalsSkeleton() {
  return (
    <section className="bg-cream py-10 md:py-16 lg:py-24" aria-hidden="true">
      <div className="luxury-container">
        <SectionHeading
          headingId="new-arrivals-heading-skeleton"
          eyebrow="Just Arrived"
          title="New Arrivals"
          subtitle="Fresh silhouettes inspired by Mughal gardens and Lucknowi heritage."
        />

        <div className="grid grid-cols-2 gap-x-2.5 gap-y-5 sm:gap-x-5 sm:gap-y-8 md:grid-cols-3 lg:grid-cols-6 lg:gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function BestSellersSkeleton() {
  return (
    <section className="bg-cream py-10 md:py-16 lg:py-24" aria-hidden="true">
      <div className="luxury-container">
        <SectionHeading
          headingId="bestsellers-heading-skeleton"
          eyebrow="Most Loved"
          title="Best Sellers"
          subtitle="The most cherished handcrafted pieces from our collection."
        />

        <div className="grid grid-cols-2 gap-x-2.5 gap-y-5 sm:gap-x-5 sm:gap-y-8 lg:grid-cols-4 lg:gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function ShopByCategorySkeleton() {
  return (
    <section className="bg-beige py-10 sm:py-12 md:py-16 lg:py-24" aria-hidden="true">
      <div className="luxury-container">
        <div className="mb-8 flex flex-col gap-4 text-center md:mb-12 md:items-center">
          <div>
            <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.28em] text-gold md:text-xs">
              Explore
            </span>

            <h2 className="font-heading text-3xl leading-tight text-charcoal md:text-5xl lg:text-6xl">
              Shop by Category
            </h2>

            <div className="divider-gold mx-auto mt-4 w-20 md:mt-5 md:w-24" />
          </div>

          <p className="mx-auto max-w-xl text-sm leading-7 text-charcoal/55 md:text-base md:leading-8">
            Move directly into the collection you are looking for — from
            handcrafted Chikankari classics to festive accessories.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-2.5 gap-y-5 sm:gap-x-5 sm:gap-y-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="shimmer aspect-[4/5] w-full" />
          ))}
        </div>
      </div>
    </section>
  );
}
