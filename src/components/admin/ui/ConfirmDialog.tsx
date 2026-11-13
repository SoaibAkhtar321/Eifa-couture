'use client';

import { useEffect, useRef } from 'react';

import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { Z_INDEX } from '@/lib/z-index';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Replaces window.confirm() for destructive admin actions. */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Yes, continue',
  cancelLabel = 'No, go back',
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) onCancel();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-charcoal/50 p-4"
      style={{ zIndex: Z_INDEX.fullscreen }}
      onClick={() => !busy && onCancel()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="w-full max-w-md rounded-xl bg-ivory p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="font-heading text-xl text-maroon">
          {title}
        </h2>
        <p id="confirm-message" className="mt-2 text-sm text-ink-soft">
          {message}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="min-h-[48px] rounded-lg border border-charcoal/20 px-5 text-sm font-medium text-charcoal hover:bg-charcoal/5 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`min-h-[48px] rounded-lg px-5 text-sm font-medium text-white disabled:opacity-50 ${
              destructive ? 'bg-red-700 hover:bg-red-800' : 'bg-maroon hover:bg-maroon/90'
            }`}
          >
            {busy ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
