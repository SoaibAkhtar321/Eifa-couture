import ShopProductCard from '@/components/shop/ShopProductCard';
import type { Product } from '@/types';

interface RelatedProductsProps {
  products: Product[];
}

export default function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section className="section-padding bg-ivory">
      <div className="luxury-container">
        <div className="mb-10 flex flex-col gap-3 sm:mb-14">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold-dark">
            You May Also Like
          </p>

          <h2 className="font-heading text-4xl text-charcoal sm:text-5xl">
            Related Pieces
          </h2>

          <p className="max-w-2xl text-sm leading-7 text-charcoal/60">
            Continue exploring handcrafted silhouettes that carry the same quiet
            luxury and Lucknowi refinement.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product, index) => (
            <ShopProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
