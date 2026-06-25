import Link from 'next/link';
import { getFeaturedProducts } from '@/lib/mock-data';
import { formatPrice, getDiscountPercentage } from '@/lib/utils';

export default function FeaturedCollection() {
  const products = getFeaturedProducts().slice(0, 4);

  const productImages = [
    '/images/products/product-1.png',
    '/images/products/product-2.png',
    '/images/products/product-3.png',
    '/images/products/product-4.png',
  ];

  return (
    <section className="section-padding bg-ivory" aria-labelledby="featured-heading">
      <div className="luxury-container">
        <div className="mb-12 text-center md:mb-20">
          <span className="mb-4 block font-body text-xs uppercase tracking-[0.3em] text-gold">
            Curated for You
          </span>

          <h2
            id="featured-heading"
            className="font-heading text-3xl text-charcoal md:text-5xl lg:text-6xl"
          >
            Featured Collection
          </h2>

          <div className="divider-gold mx-auto mt-5 w-24" />

          <p className="mx-auto mt-5 max-w-xl font-subheading text-lg italic text-charcoal/60 md:text-xl">
            Handpicked masterpieces that define the art of Lucknowi Chikankari
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product, idx) => {
            const discount = product.compareAtPrice
              ? getDiscountPercentage(product.compareAtPrice, product.price)
              : 0;

            return (
              <article key={product.id} className="group">
                <Link href={`/product/${product.slug}`} className="block h-full">
                  <div className="card-luxury flex h-full flex-col overflow-hidden">
                    <div className="relative aspect-[3/4] flex-shrink-0 overflow-hidden bg-beige">
                      <img
                        src={productImages[idx]}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />

                      {discount > 0 && (
                        <span className="absolute left-3 top-3 z-10 bg-maroon px-3 py-1.5 font-body text-[10px] uppercase tracking-[0.15em] text-white">
                          {discount}% Off
                        </span>
                      )}
                    </div>

                    <div className="flex flex-grow flex-col justify-between p-5 md:p-6">
                      <div>
                        <p className="mb-2 font-body text-[11px] uppercase tracking-[0.2em] text-gold">
                          {product.fabric}
                        </p>

                        <h3 className="font-heading text-lg leading-snug text-charcoal transition-colors duration-300 group-hover:text-maroon md:text-xl">
                          {product.name}
                        </h3>
                      </div>

                      <div className="mt-4 flex items-center gap-3">
                        <span className="font-subheading text-xl font-semibold text-charcoal md:text-2xl">
                          {formatPrice(product.price)}
                        </span>

                        {product.compareAtPrice && (
                          <span className="font-body text-sm text-charcoal/40 line-through">
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

        <div className="mt-12 text-center md:mt-16">
          <Link href="/shop" className="btn-luxury btn-luxury-secondary">
            View All Collection
          </Link>
        </div>
      </div>
    </section>
  );
}
