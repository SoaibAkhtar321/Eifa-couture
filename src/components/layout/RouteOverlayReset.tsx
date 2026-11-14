'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

import { useUIStore } from '@/store/ui-store';

/**
 * Closes every overlay (menu, search, cart) whenever the route changes.
 * Without this, an overlay left open by one tap could sit over the page
 * and swallow the next taps on the bottom navigation.
 */
export default function RouteOverlayReset() {
  const pathname = usePathname();
  const resetOverlays = useUIStore((state) => state.resetOverlays);
  const lastPath = useRef(pathname);

  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    resetOverlays();
  }, [pathname, resetOverlays]);

  return null;
}
