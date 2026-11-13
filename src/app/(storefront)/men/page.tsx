import type { Metadata } from 'next';

import AudiencePage from '@/components/audience/AudiencePage';

export const metadata: Metadata = {
  title: "Men's Chikankari Collection | Eifa Couture",
  description: 'Handcrafted Lucknowi Chikankari from Eifa Couture. Browse the full collection.',
  alternates: { canonical: '/men' },
};

export default function Page() {
  return <AudiencePage audience="men" />;
}
