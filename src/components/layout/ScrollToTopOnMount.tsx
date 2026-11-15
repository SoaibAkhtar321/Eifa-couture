'use client';

import { useLayoutEffect } from 'react';

/** Puts the page at the top as soon as it mounts. Renders nothing. */
export default function ScrollToTopOnMount() {
  useLayoutEffect(() => {
    const html = document.documentElement;
    const previous = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    html.style.scrollBehavior = previous;
  }, []);

  return null;
}
