'use client';

/* ============================================
   EIFA COUTURE — Product Image
   ============================================
   Thin wrapper around next/image that swaps to a category placeholder
   if the real image URL 404s or fails to load at runtime (e.g. an
   expired/deleted Supabase Storage object). The data layer already
   substitutes a placeholder when a product has *no* image row — this
   component covers the case where the URL exists but breaks live,
   which `next/image` otherwise renders as a broken-image icon.

   No effect here on purpose: rather than syncing state to the `src`
   prop via useEffect (which re-renders twice and trips the
   set-state-in-effect rule), the "did this exact src fail" flag is
   compared against the *current* prop on every render, so a prop
   change naturally invalidates a stale failure with no reset step —
   and `key={resolvedSrc}` remounts the underlying <Image> so its own
   internal load state doesn't linger across a swap either.
   ============================================ */

import { useState } from 'react';
import Image, { type ImageProps } from 'next/image';

const DEFAULT_FALLBACK_IMAGE = '/images/categories/kurtas.png';

interface ProductImageProps extends Omit<ImageProps, 'src' | 'onError'> {
  src: string;
  fallbackSrc?: string;
}

export default function ProductImage({
  src,
  fallbackSrc = DEFAULT_FALLBACK_IMAGE,
  alt,
  ...rest
}: ProductImageProps) {
  // Holds the specific src that most recently failed to load — not
  // "has an error happened", so it self-invalidates the moment the
  // caller passes a different src, with no manual reset required.
  const [erroredSrc, setErroredSrc] = useState<string | null>(null);

  const resolvedSrc = src || fallbackSrc;
  const currentSrc = erroredSrc === resolvedSrc ? fallbackSrc : resolvedSrc;

  return (
    <Image
      {...rest}
      key={resolvedSrc}
      src={currentSrc}
      alt={alt}
      onError={() => setErroredSrc(resolvedSrc)}
    />
  );
}
