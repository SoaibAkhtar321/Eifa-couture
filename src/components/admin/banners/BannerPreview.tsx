'use client';

import Image from 'next/image';
import { useState } from 'react';

interface BannerPreviewProps {
  title: string;
  subtitle: string;
  imageUrl: string | null;
  mobileImageUrl: string | null;
  ctaLabel: string | null;
}

/**
 * Renders the banner as it will roughly appear on the storefront —
 * reflects the form's current, unsaved values (unlike the Homepage
 * CMS preview, a banner has no separate storefront component to
 * reuse yet, so this is a lightweight standalone approximation).
 */
export default function BannerPreview({ title, subtitle, imageUrl, mobileImageUrl, ctaLabel }: BannerPreviewProps) {
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');

  const activeImage = viewport === 'mobile' ? mobileImageUrl || imageUrl : imageUrl;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setViewport('desktop')}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
            viewport === 'desktop' ? 'bg-maroon text-ivory' : 'bg-charcoal/10 text-charcoal/60 hover:bg-charcoal/15'
          }`}
        >
          Desktop
        </button>
        <button
          type="button"
          onClick={() => setViewport('mobile')}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
            viewport === 'mobile' ? 'bg-maroon text-ivory' : 'bg-charcoal/10 text-charcoal/60 hover:bg-charcoal/15'
          }`}
        >
          Mobile
        </button>
      </div>

      <div
        className={`relative mx-auto overflow-hidden rounded-lg border border-charcoal/10 bg-charcoal ${
          viewport === 'mobile' ? 'aspect-[9/16] max-w-[280px]' : 'aspect-[21/9] w-full'
        }`}
      >
        {activeImage ? (
          <Image src={activeImage} alt={title || 'Banner preview'} fill sizes="100vw" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-ivory/40">
            Upload an image to preview
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 space-y-2 p-4 text-center sm:p-6">
          {title && (
            <p className="font-heading text-lg text-ivory sm:text-2xl">{title}</p>
          )}
          {subtitle && <p className="text-xs text-ivory/80 sm:text-sm">{subtitle}</p>}
          {ctaLabel && (
            <span className="inline-block rounded-full bg-ivory px-4 py-1.5 text-[10px] font-medium uppercase tracking-wide text-charcoal sm:text-xs">
              {ctaLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
