'use client';

import { useLayoutEffect, useState } from 'react';
import Link from 'next/link';

import ProductImageGallery from '@/components/product/ProductImageGallery';
import ProductInfo from '@/components/product/ProductInfo';
import ProductReviews from '@/components/product/ProductReviews';
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
  // Runs before paint, eliminating the visible scroll jump.
  // Combined with key={slug} on the parent, this now runs on a fresh mount
  // every time, instead of racing a prop update on a reused instance.
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  // Owned here (not inside ProductInfo) purely so the gallery — a
  // sibling — can react to it too. ProductInfo still owns size and
  // every other selection field; this is the one piece both halves
  // of the page need.
  const [selectedColor, setSelectedColor] = useState('');
  const galleryImages =
    (selectedColor && product.imagesByColor[selectedColor]?.length
      ? product.imagesByColor[selectedColor]
      : product.images) ?? product.images;

  if (!product) return null;

  return (
    <main className="bg-ivory w-full overflow-x-hidden">
      <section className="border-b border-beige bg-gradient-to-b from-cream/60 to-ivory">
        <div className="luxury-container py-4 sm:py-5">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-charcoal/45 sm:text-[11px]"
          >
            <Link href="/" className="transition-colors duration-300 hover:text-maroon">
              Home
            </Link>
            <span>/</span>
            <Link href="/shop" className="transition-colors duration-300 hover:text-maroon">
              Shop
            </Link>
            <span>/</span>
            <span className="line-clamp-1 text-charcoal/70">
              {product.name || 'Product Details'}
            </span>
          </nav>
        </div>
      </section>

      {/* min-h-[400vh] removed — it was reserving 4x viewport height
          regardless of actual content, which is what was pushing
          the landing position into Reviews/Related/footer. */}
      <section className="pb-12 pt-6 sm:pb-16 sm:pt-8 lg:pb-20 lg:pt-12">
        <div className="luxury-container">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)] lg:gap-12 xl:gap-16 items-start">
            {product.images?.length > 0 && (
              <ProductImageGallery product={product} images={galleryImages} />
            )}
            <ProductInfo product={product} onColorChange={setSelectedColor} />
          </div>
        </div>
      </section>

      <ProductReviews product={product} />
      <RelatedProducts products={relatedProducts} />
    </main>
  );
}