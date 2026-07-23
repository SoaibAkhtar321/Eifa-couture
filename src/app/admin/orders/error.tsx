'use client';

import ErrorState from '@/components/admin/ErrorState';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState message="Couldn't load orders. Please try again." onRetry={reset} />;
}
