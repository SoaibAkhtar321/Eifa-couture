'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

import ProductImage from '@/components/ui/ProductImage';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import type { Product } from '@/types';

interface ProductImageGalleryProps {
  product: Product;
  /** Resolved gallery to display — the selected color's images when it
   *  has any, otherwise the product-level gallery. Defaults to
   *  `product.images` so this component still works standalone. */
  images?: string[];
}

export default function ProductImageGallery({
  product,
  images = product.images,
}: ProductImageGalleryProps) {
  // Selection is tracked per gallery: when `images` changes (shopper
  // switched color) the stale selection is ignored and the new
  // gallery's first photo is shown — no effect/extra render needed.
  const [selection, setSelection] = useState<{ gallery: string[]; image: string | undefined }>({
    gallery: images,
    image: images[0],
  });
  const selectedImage =
    selection.gallery === images && selection.image ? selection.image : images[0];
  const setSelectedImage = (image: string) => setSelection({ gallery: images, image });
  const [mobileIndex, setMobileIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  useBodyScrollLock(isZoomOpen);

  const zoomTriggerRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const openZoom = () => setIsZoomOpen(true);
  const closeZoom = () => setIsZoomOpen(false);

  // Move focus into the dialog on open, and back to the element that
  // opened it on close — standard modal a11y expectation that this
  // full-screen zoom overlay (role="dialog") was missing entirely.
  useEffect(() => {
    if (isZoomOpen) {
      closeButtonRef.current?.focus();
    } else {
      zoomTriggerRef.current?.focus();
    }
  }, [isZoomOpen]);

  // Escape closes the zoom overlay — again, a baseline expectation for
  // any element marked aria-modal="true" that wasn't wired up before.
  useEffect(() => {
    if (!isZoomOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeZoom();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isZoomOpen]);

  return (
    <div className="w-full">
      {/* Phones and tablets: swipeable carousel (scroll-snap), tap to zoom */}
      <div className="lg:hidden" key={images.join('|')}>
        <div
          className="-mx-6 flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] sm:mx-0 [&::-webkit-scrollbar]:hidden"
          onScroll={(event) => {
            const el = event.currentTarget;
            setMobileIndex(Math.round(el.scrollLeft / el.clientWidth));
          }}
          role="group"
          aria-roledescription="carousel"
          aria-label={`${product.name} photos`}
        >
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => {
                setSelectedImage(image);
                openZoom();
              }}
              aria-label={`Zoom photo ${index + 1} of ${images.length}`}
              className="relative aspect-[4/5] w-full shrink-0 snap-center bg-cream sm:aspect-[5/4]"
            >
              <ProductImage
                src={image}
                alt={index === 0 ? product.name : `${product.name} photo ${index + 1}`}
                fill
                sizes="100vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>
        {images.length > 1 && (
          <p className="mt-3 flex items-center justify-center gap-2" aria-live="polite">
            <span className="sr-only">{`Photo ${mobileIndex + 1} of ${images.length}`}</span>
            {images.map((image, index) => (
              <span
                key={image}
                aria-hidden="true"
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === mobileIndex ? 'w-6 bg-maroon' : 'w-1.5 bg-ink-muted/50'
                }`}
              />
            ))}
          </p>
        )}
      </div>

      {/* Desktop: thumbnails + large zoomable image */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        // Added explicit height constraints to prevent DOM collapse on mobile viewports
        className="hidden h-full gap-4 lg:grid lg:grid-cols-[96px_1fr]"
      >
        <div
          className="order-2 flex gap-3 overflow-x-auto pb-4 lg:order-1 lg:flex-col lg:overflow-visible lg:pb-0 touch-pan-x max-w-full"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setSelectedImage(image)}
              className={`relative h-20 w-16 sm:h-24 sm:w-20 shrink-0 overflow-hidden border bg-cream transition-all duration-300 lg:h-28 lg:w-24 cursor-pointer ${
                selectedImage === image
                  ? 'border-maroon'
                  : 'border-transparent hover:border-gold'
              }`}
              aria-label={`View product image ${index + 1}`}
            >
              <ProductImage
                src={image}
                alt={`${product.name} ${index + 1}`}
                fill
                sizes="(max-width: 640px) 64px, 80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>

        <button
          ref={zoomTriggerRef}
          type="button"
          onClick={openZoom}
          className="group relative order-1 aspect-[3/4] w-full overflow-hidden bg-cream lg:order-2 cursor-zoom-in min-h-[350px]"
          aria-label={`Zoom ${product.name}`}
        >
          <ProductImage
            src={selectedImage}
            alt={product.name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          <span className="absolute bottom-5 right-5 bg-ivory/95 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.22em] text-charcoal shadow-sm pointer-events-none">
            Click to zoom
          </span>
        </button>
      </motion.div>

      {isZoomOpen && (
        <div
          className="fixed inset-0 z-(--z-fullscreen) flex items-center justify-center bg-charcoal/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${product.name} zoomed image`}
        >
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeZoom}
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full border border-white/25 text-2xl text-white transition-colors duration-300 hover:bg-white hover:text-charcoal cursor-pointer"
            aria-label="Close image zoom"
          >
            ×
          </button>

          <div className="relative h-[82vh] w-full max-w-4xl flex items-center justify-center">
            <ProductImage
              src={selectedImage}
              alt={product.name}
              fill
              sizes="90vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
