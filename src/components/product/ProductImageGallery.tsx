'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

import type { Product } from '@/types';

interface ProductImageGalleryProps {
  product: Product;
}

export default function ProductImageGallery({
  product,
}: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(product.images[0]);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="grid gap-4 lg:grid-cols-[96px_1fr]"
      >
        <div className="order-2 flex gap-3 overflow-x-auto pb-2 lg:order-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {product.images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setSelectedImage(image)}
              className={`relative h-24 w-20 shrink-0 overflow-hidden border bg-cream transition-all duration-300 lg:h-28 lg:w-24 ${
                selectedImage === image
                  ? 'border-maroon'
                  : 'border-transparent hover:border-gold'
              }`}
              aria-label={`View product image ${index + 1}`}
            >
              <Image
                src={image}
                alt={`${product.name} ${index + 1}`}
                fill
                sizes="96px"
                className="object-cover"
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIsZoomOpen(true)}
          className="group relative order-1 aspect-[3/4] overflow-hidden bg-cream lg:order-2"
          aria-label={`Zoom ${product.name}`}
        >
          <Image
            src={selectedImage}
            alt={product.name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          <span className="absolute bottom-5 right-5 bg-ivory/95 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.22em] text-charcoal shadow-sm">
            Click to Zoom
          </span>
        </button>
      </motion.div>

      {isZoomOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/90 p-4">
          <button
            type="button"
            onClick={() => setIsZoomOpen(false)}
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full border border-white/25 text-2xl text-white transition-colors duration-300 hover:bg-white hover:text-charcoal"
            aria-label="Close image zoom"
          >
            ×
          </button>

          <div className="relative h-[82vh] w-full max-w-4xl">
            <Image
              src={selectedImage}
              alt={product.name}
              fill
              sizes="90vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}