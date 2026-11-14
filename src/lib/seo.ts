import type { Metadata } from 'next';

import { SITE_URL } from '@/lib/constants';

export const SITE_NAME = 'Eifa Couture';

/**
 * Per-page metadata with a complete, absolute Open Graph / Twitter block.
 * A page-level `openGraph` replaces the root layout's object (Next merges
 * metadata shallowly per key), so siteName/locale/type must be repeated here.
 *
 * `title` is the short page title (the root layout's template appends
 * "| Eifa Couture"); `shareTitle` is the full string used in link previews.
 */
export function buildPageMetadata({
  title,
  description,
  path,
  images,
}: {
  title: string;
  description: string;
  /** Path with leading slash, e.g. "/women". */
  path: string;
  /** Omit to let a sibling `opengraph-image` file supply the image. */
  images?: { url: string; width?: number; height?: number; alt?: string }[];
}): Metadata {
  const url = `${SITE_URL}${path}`;
  const shareTitle = `${title} | ${SITE_NAME}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      siteName: SITE_NAME,
      locale: 'en_IN',
      title: shareTitle,
      description,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: shareTitle,
      description,
      ...(images ? { images: images.map((i) => i.url) } : {}),
    },
  };
}
