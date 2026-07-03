'use client';

import { useEffect } from 'react';

/* ============================================
   EIFA COUTURE — Body Scroll Lock
   ============================================
   Single shared implementation for locking background scroll while an
   overlay (cart drawer, mobile menu, search, filter sheet, lightbox...)
   is open. Replaces the previous pattern of every overlay component
   writing its own `document.body.style.overflow = 'hidden'` effect.

   Why a module-level counter instead of each component just setting/
   restoring overflow itself:

   - useUIStore already guarantees only one *known* overlay is open at a
     time, but that guarantee doesn't extend to overlays outside the
     store (e.g. the image lightbox, filter sheets) or to the brief
     window during an exit animation where a component is still mounted
     after its "isOpen" flag has flipped. If two lock requests ever do
     overlap, independent implementations can stomp on each other: the
     first to close restores `overflow` to a stale captured value while
     the second overlay is still meant to be locking the page.
   - A counter means the lock is only released when the *last* active
     overlay releases it, regardless of ordering.

   Usage: call this hook with `isActive` inside any overlay component.
   No other body-scroll-lock logic should live in individual components.
   ============================================ */

let lockCount = 0;
let previousOverflow = '';
let previousTouchAction = '';

function lockBodyScroll() {
  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow;
    previousTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    // touch-action guards against Android Chrome's scroll-chaining, where
    // a swipe that reaches the end of a nested scrollable panel (cart
    // items, menu links) can still bleed through to whatever's behind an
    // `overflow: hidden` body.
    document.body.style.touchAction = 'none';
  }
  lockCount += 1;
}

function unlockBodyScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = previousOverflow;
    document.body.style.touchAction = previousTouchAction;
  }
}

export function useBodyScrollLock(isActive: boolean) {
  useEffect(() => {
    if (!isActive) return;

    lockBodyScroll();
    return () => {
      unlockBodyScroll();
    };
  }, [isActive]);
}
