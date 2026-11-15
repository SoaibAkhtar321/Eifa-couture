import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Private / transactional page: keep it out of search results.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PrivateSectionLayout({ children }: { children: ReactNode }) {
  return children;
}
