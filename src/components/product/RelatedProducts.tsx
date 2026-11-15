import Reveal from '@/components/motion/Reveal';
import ProductCard from '@/components/product/ProductCard';
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

          <p className="max-w-2xl text-sm leading-7 text-ink-muted">
            Continue exploring handcrafted silhouettes that carry the same quiet
            luxury and Lucknowi refinement.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-3.5 sm:gap-x-6 sm:gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product, index) => (
            <Reveal key={product.id} delay={Math.min(index * 0.06, 0.3)}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
