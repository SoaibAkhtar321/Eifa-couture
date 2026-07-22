'use client';

import ErrorState from '@/components/admin/ErrorState';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState message="Couldn't load banners. Please try again." onRetry={reset} />;
}
