import fs from 'node:fs';
import path from 'node:path';

import type { Audience } from '@/lib/catalog';

/**
 * Editorial content for the Women / Men / Accessories blocks, shared by
 * the homepage sections and the dedicated /women, /men and /accessories
 * pages so the two can never drift apart.
 */
export interface AudienceContent {
  audience: Audience;
  path: string;
  eyebrow: string;
  title: string;
  tagline: string;
  intro: string;
  cta: string;
  chips: string[];
  image: string;
  imageAlt: string;
  /** Background of the homepage block. */
  section: string;
  dark: boolean;
  imageRight: boolean;
}

const DUPATTA_FALLBACK = '/images/categories/dupattas.png';

/**
 * Accessories lead image. Drop a silk-bag / potli + dupatta photo at
 * public/images/collections/accessories.(webp|jpg|jpeg|png) and it is
 * picked up automatically; until then the dupatta photo is used.
 */
function resolveAccessoriesImage(): string {
  for (const ext of ['webp', 'jpg', 'jpeg', 'png']) {
    const file = `accessories.${ext}`;
    if (fs.existsSync(path.join(process.cwd(), 'public', 'images', 'collections', file))) {
      return `/images/collections/${file}`;
    }
  }
  return DUPATTA_FALLBACK;
}

/**
 * `imageOverride` is the admin-set panel image (store_settings.panel_image_*);
 * when null/empty the built-in default image below is used, so the
 * homepage never shows a broken or blank panel.
 */
export function getAudienceContent(audience: Audience, imageOverride?: string | null): AudienceContent {
  const content = getDefaultAudienceContent(audience);
  const override = imageOverride?.trim();
  return override ? { ...content, image: override } : content;
}

function getDefaultAudienceContent(audience: Audience): AudienceContent {
  switch (audience) {
    case 'women':
      return {
        audience,
        path: '/women',
        eyebrow: 'For Her',
        title: "Women's Collection",
        tagline: 'A canvas of Lucknowi artistry',
        intro: 'Sarees, kurta sets, anarkalis and bridal wear, hand-embroidered by our karigars.',
        cta: "Explore Women's Collection",
        chips: ['Sarees', 'Kurta Sets', 'Anarkalis', 'Bridal'],
        image: '/images/categories/sarees.png',
        imageAlt: 'Model draped in an ivory Chikankari saree',
        section: 'bg-ivory',
        dark: false,
        imageRight: false,
      };
    case 'men':
      return {
        audience,
        path: '/men',
        eyebrow: 'For Him',
        title: "Men's Collection",
        tagline: 'Understated, timeless, refined',
        intro: 'Chikankari kurtas in cotton, silk and linen for festive days and every day.',
        cta: "Explore Men's Collection",
        chips: ['Kurtas', 'Kurta Sets', 'Festive', 'Everyday'],
        image: '/images/collections/men.png',
        imageAlt: 'Model in an ivory Chikankari kurta',
        section: 'bg-espresso',
        dark: true,
        imageRight: true,
      };
    case 'accessories':
      return {
        audience,
        path: '/accessories',
        eyebrow: 'The Finishing Touch',
        title: 'Bags & Accessories',
        tagline: 'Silk bags, potlis and dupattas',
        intro: 'Silk bags, potlis, clutches and hand-embroidered dupattas to complete every look.',
        cta: 'Explore Accessories',
        chips: ['Silk Bags', 'Potlis', 'Dupattas', 'Stoles'],
        image: resolveAccessoriesImage(),
        imageAlt: 'Silk bags and hand-embroidered dupattas',
        section: 'bg-parchment',
        dark: false,
        imageRight: false,
      };
  }
}
