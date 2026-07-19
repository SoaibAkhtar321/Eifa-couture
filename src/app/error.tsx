'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Errors thrown in Server Components are stripped of their message
    // before reaching the client, and only the request `digest` (for
    // matching against server logs) survives — logging it here is the
    // only client-side signal available for a production incident.
    console.error(error);
  }, [error]);

  return (
    <main className="bg-ivory">
      <section className="min-h-[68vh] border-b border-beige bg-gradient-to-b from-cream/70 to-ivory">
        <div className="luxury-container flex min-h-[68vh] items-center justify-center py-16 text-center">
          <div className="max-w-2xl">
            <span className="mb-4 block font-body text-[11px] uppercase tracking-[0.34em] text-gold">
              Something Went Wrong
            </span>

            <h1 className="font-heading text-6xl leading-none text-maroon sm:text-7xl lg:text-8xl">
              Oops
            </h1>

            <h2 className="mt-6 font-heading text-4xl leading-tight text-charcoal sm:text-5xl">
              This piece needs a moment
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-charcoal/58 sm:text-base sm:leading-8">
              We hit an unexpected error loading this page. Please try again —
              if it keeps happening, come back to the homepage and continue
              browsing the collection.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => reset()}
                className="btn-luxury btn-luxury-primary"
              >
                Try Again
              </button>

              <Link href="/" className="btn-luxury btn-luxury-secondary">
                Back To Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
