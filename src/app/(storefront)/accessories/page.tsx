import type { Metadata } from 'next';

import AudiencePage from '@/components/audience/AudiencePage';

export const metadata: Metadata = {
  title: "Silk Bags, Dupattas & Accessories | Eifa Couture",
  description: 'Handcrafted Lucknowi Chikankari from Eifa Couture. Browse the full collection.',
  alternates: { canonical: '/accessories' },
};

export default function Page() {
  return <AudiencePage audience="accessories" />;
}
