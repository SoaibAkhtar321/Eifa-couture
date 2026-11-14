import type { Metadata } from 'next';

import { buildPageMetadata } from '@/lib/seo';
import AudiencePage from '@/components/audience/AudiencePage';

export const metadata: Metadata = buildPageMetadata({
  title: 'Silk Bags, Dupattas & Accessories',
  description: 'Handcrafted Lucknowi Chikankari from Eifa Couture. Browse the full collection.',
  path: '/accessories',
});

export default function Page() {
  return <AudiencePage audience="accessories" />;
}
