import Link from 'next/link';

import ProductImage from '@/components/ui/ProductImage';
import { createClient } from '@/lib/supabase/server';
import { fetchBestSellers } from '@/lib/data/products';
import { formatPrice, getDiscountPercentage } from '@/lib/utils';

export default async function BestSellersSection() {
  const supabase = await createClient();
  const products = await fetchBestSellers(supabase, 4);

  if (products.length === 0) return null;

  return (
    <section className="bg-cream py-10 md:py-16 lg:py-24" aria-labelledby="bestsellers-heading">
      <div className="luxury-container">
        <div className="mb-8 text-center md:mb-12">
          <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.28em] text-gold md:text-xs">
            Most Loved
          </span>

          <h2
            id="bestsellers-heading"
            className="font-heading text-2xl text-charcoal md:text-5xl lg:text-6xl"
          >
            Best Sellers
          </h2>

          <div className="divider-gold mx-auto mt-4 w-20 md:mt-5 md:w-24" />

          <p className="mx-auto mt-4 max-w-xl font-subheading text-base italic text-charcoal/60 md:text-xl">
            The most cherished handcrafted pieces from our collection.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
          {products.map((product) => {
            const discount = product.compareAtPrice
              ? getDiscountPercentage(product.compareAtPrice, product.minPrice)
              : 0;

            return (
              <article key={product.id} className="group">
                <Link href={`/product/${product.slug}`} className="block h-full">
                  <div className="flex h-full flex-col overflow-hidden bg-white">
                    <div className="relative aspect-[4/5] overflow-hidden bg-beige">
                      <ProductImage
                        src={product.images?.[0]}
                        alt={product.name}
                        fill
                        sizes="(max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />

                      <span className="absolute left-2 top-2 bg-maroon px-2 py-1 font-body text-[8px] uppercase tracking-[0.12em] text-white md:left-3 md:top-3 md:px-3 md:py-1.5 md:text-[10px]">
                        Bestseller
                      </span>

                      {discount > 0 && (
                        <span className="absolute right-2 top-2 bg-white/90 px-2 py-1 font-body text-[8px] uppercase tracking-[0.12em] text-maroon md:right-3 md:top-3 md:text-[10px]">
                          {discount}% Off
                        </span>
                      )}
                    </div>

                    <div className="flex flex-grow flex-col justify-between px-2.5 py-3 md:p-5">
                      <div>
                        <p className="mb-1 font-body text-[9px] uppercase tracking-[0.16em] text-gold md:text-[11px]">
                          {product.fabric}
                        </p>

                        <h3 className="line-clamp-2 font-heading text-sm leading-snug text-charcoal transition-colors duration-300 group-hover:text-maroon md:text-lg">
                          {product.name}
                        </h3>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5 md:mt-4 md:gap-3">
                        <span className="font-subheading text-base font-semibold text-charcoal md:text-xl">
                          {product.hasPriceRange
                            ? `From ${formatPrice(product.minPrice)}`
                            : formatPrice(product.minPrice)}
                        </span>

                        {product.compareAtPrice && (
                          <span className="font-body text-[11px] text-charcoal/40 line-through md:text-sm">
                            {formatPrice(product.compareAtPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>

        <div className="mt-8 text-center md:mt-12">
          <Link
            href="/shop"
            className="btn-luxury btn-luxury-secondary px-6 py-3 text-[11px] md:px-10 md:py-4 md:text-sm"
          >
            View Best Sellers
          </Link>
        </div>
      </div>
    </section>
  );
}
