import { OG_CONTENT_TYPE, OG_SIZE, renderBrandOg } from '@/lib/og/brand-og';

export const alt = "Shop the Collection | Eifa Couture";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return renderBrandOg({
    eyebrow: 'Eifa Couture',
    title: "Shop the Collection",
    subtitle: "Handcrafted Lucknowi Chikankari",
  });
}
