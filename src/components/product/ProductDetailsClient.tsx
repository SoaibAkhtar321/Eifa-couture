import { motion } from 'framer-motion';

import ProductImageGallery from '@/components/product/ProductImageGallery';
import ProductInfo from '@/components/product/ProductInfo';
import RelatedProducts from '@/components/product/RelatedProducts';
import type { Product } from '@/types';

interface ProductDetailsClientProps {
  product: Product;
  relatedProducts: Product[];
}

export default function ProductDetailsClient({
  product,
  relatedProducts,
}: ProductDetailsClientProps) {
  return (
    <div className="bg-ivory">
      <section className="pt-32 pb-16 sm:pt-36 lg:pt-44 lg:pb-24">
        <div className="luxury-container">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mb-8 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.22em] text-charcoal/45"
          >
            <span>Home</span>
            <span>/</span>
            <span>Shop</span>
            <span>/</span>
            <span className="text-maroon">{product.name}</span>
          </motion.div>

          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <ProductImageGallery product={product} />
            <ProductInfo product={product} />
          </div>
        </div>
      </section>

      <section className="border-y border-beige bg-cream py-14 sm:py-18">
        <div className="luxury-container">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                label: 'Craft',
                value: 'Hand Embroidered',
                text: 'Each piece is finished by skilled Lucknowi karigars with patient detailing.',
              },
              {
                label: 'Fabric',
                value: product.fabric,
                text: 'Premium fabric selected for graceful drape, comfort, and longevity.',
              },
              {
                label: 'Heritage',
                value: 'Since 1998',
                text: 'Rooted in the elegance of Lucknowi Chikankari and refined for today.',
              },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-gold-dark">
                  {item.label}
                </p>
                <h3 className="mt-2 font-subheading text-2xl text-maroon">
                  {item.value}
                </h3>
                <p className="mt-3 text-sm leading-7 text-charcoal/60">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <RelatedProducts products={relatedProducts} />
    </div>
  );
}