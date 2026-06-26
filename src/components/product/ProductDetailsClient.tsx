'use client';

import { useLayoutEffect } from 'react';

import Link from 'next/link';
import { motion } from 'framer-motion';

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
  useLayoutEffect(() => {
    const html = document.documentElement;
    const previousScrollBehavior = html.style.scrollBehavior;

    html.style.scrollBehavior = 'auto';

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    });

    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto',
      });

      html.style.scrollBehavior = previousScrollBehavior;
    });

    return () => {
      window.cancelAnimationFrame(frame);
      html.style.scrollBehavior = previousScrollBehavior;
    };
  }, [product.slug]);

  return (
    <main className="bg-ivory">
      <section className="border-b border-beige bg-gradient-to-b from-cream/60 to-ivory">
        <div className="luxury-container py-4 sm:py-5">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-charcoal/45 sm:text-[11px]"
          >
            <Link
              href="/"
              className="transition-colors duration-300 hover:text-maroon"
            >
              Home
            </Link>

            <span>/</span>

            <Link
              href="/shop"
              className="transition-colors duration-300 hover:text-maroon"
            >
              Shop
            </Link>

            <span>/</span>

            <span className="line-clamp-1 text-charcoal/70">
              {product.name}
            </span>
          </nav>
        </div>
      </section>

      <section className="pb-12 pt-6 sm:pb-16 sm:pt-8 lg:pb-20 lg:pt-12">
        <div className="luxury-container">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)] lg:gap-12 xl:gap-16"
          >
            <ProductImageGallery product={product} />
            <ProductInfo product={product} />
          </motion.div>
        </div>
      </section>

      <ProductReviews product={product} />

      <RelatedProducts products={relatedProducts} />
    </main>
  );
}