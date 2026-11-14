'use client';

/* ============================================
   EIFA COUTURE — Category tile image
   ============================================
   Shows the category picture (uploaded or latest product photo). When
   there is no picture — or the file fails to load — it shows the
   neutral maroon/gold placeholder instead of an unrelated product
   photo. Fills its relatively positioned parent.
   ============================================ */

import { useState } from 'react';
import Image from 'next/image';

import CategoryPlaceholder from '@/components/ui/CategoryPlaceholder';
import { isSupabaseImageUrl } from '@/lib/utils';

interface CategoryImageProps {
  src: string;
  name: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}

export default function CategoryImage({ src, name, sizes, priority, className }: CategoryImageProps) {
  // The specific src that failed — self-invalidates when `src` changes.
  const [erroredSrc, setErroredSrc] = useState<string | null>(null);

  if (!src || erroredSrc === src) {
    return <CategoryPlaceholder name={name} />;
  }

  return (
    <Image
      key={src}
      src={src}
      alt={name}
      fill
      priority={priority}
      sizes={sizes}
      unoptimized={isSupabaseImageUrl(src)}
      className={className}
      onError={() => setErroredSrc(src)}
    />
  );
}
