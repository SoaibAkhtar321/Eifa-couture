import type { Metadata } from 'next';

import { buildPageMetadata } from '@/lib/seo';
import AudiencePage from '@/components/audience/AudiencePage';

export const metadata: Metadata = buildPageMetadata({
  title: "Women's Chikankari Collection",
  description: 'Handcrafted Lucknowi Chikankari from Eifa Couture. Browse the full collection.',
  path: '/women',
});

export default function Page() {
  return <AudiencePage audience="women" />;
}
