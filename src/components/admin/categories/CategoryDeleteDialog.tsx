'use client';

import { useEffect, useState } from 'react';

import type { CategoryDeleteImpact } from '@/lib/admin/categories-actions';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { Z_INDEX } from '@/lib/z-index';

interface Option {
  value: string;
  label: string;
}

interface CategoryDeleteDialogProps {
  name: string;
  /** null while the impact is still loading. */
  impact: CategoryDeleteImpact | null;
  loadError: string | null;
  submitError: string | null;
  busy: boolean;
  /** Categories the products can be moved to (never the one being deleted). */
  productTargets: Option[];
  /** Main categories the sub-categories can be moved under. */
  childTargets: Option[];
  onConfirm: (choice: { moveProductsTo: string | null; moveChildrenTo: string | null }) => void;
  onCancel: () => void;
}

const selectClass =
  'w-full rounded-md border border-charcoal/15 bg-ivory px-3 py-2.5 text-sm text-charcoal focus:border-maroon focus:outline-none focus:ring-2 focus:ring-maroon/30';

/** Delete confirmation that shows what the category holds and makes the admin decide where it goes. */
export default function CategoryDeleteDialog({
  name,
  impact,
  loadError,
  submitError,
  busy,
  productTargets,
  childTargets,
  onConfirm,
  onCancel,
}: CategoryDeleteDialogProps) {
  const [moveProductsTo, setMoveProductsTo] = useState('');
  const [moveChildrenTo, setMoveChildrenTo] = useState('');
  useBodyScrollLock(true);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) onCancel();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [busy, onCancel]);

  const needsProductTarget = Boolean(impact && impact.productCount > 0);
  const noTargetAvailable = needsProductTarget && productTargets.length === 0;
  const canConfirm = Boolean(impact) && !busy && (!needsProductTarget || Boolean(moveProductsTo));
  const childProducts = impact?.children.reduce((sum, child) => sum + child.productCount, 0) ?? 0;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-charcoal/50 p-4"
      style={{ zIndex: Z_INDEX.fullscreen }}
      onClick={() => !busy && onCancel()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-category-title"
        className="my-auto w-full max-w-lg rounded-xl bg-ivory p-5 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="delete-category-title" className="font-heading text-xl text-maroon">
          Delete “{name}”?
        </h2>

        {loadError ? (
          <p className="mt-3 text-sm text-red-700">{loadError}</p>
        ) : !impact ? (
          <p className="mt-3 text-sm text-ink-muted">Checking what this category contains…</p>
        ) : (
          <div className="mt-3 space-y-4 text-sm text-ink-soft">
            <p>
              It will disappear from the homepage, the footer, the shop filter and search. This cannot be undone from
              the admin.
            </p>

            {needsProductTarget ? (
              <div className="space-y-1.5 rounded-lg border border-gold-deep/40 bg-beige/50 p-3">
                <label htmlFor="move-products" className="block font-medium text-charcoal">
                  {impact.productCount} product{impact.productCount === 1 ? '' : 's'} use this category. Move them to:
                </label>
                <select
                  id="move-products"
                  value={moveProductsTo}
                  onChange={(e) => setMoveProductsTo(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Choose a category…</option>
                  {productTargets.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {noTargetAvailable && (
                  <p className="text-xs text-red-700">
                    There is no other visible category to move them to. Create one first.
                  </p>
                )}
              </div>
            ) : (
              <p>No products use this category.</p>
            )}

            {impact.children.length > 0 && (
              <div className="space-y-1.5 rounded-lg border border-gold-deep/40 bg-beige/50 p-3">
                <label htmlFor="move-children" className="block font-medium text-charcoal">
                  {impact.children.length} sub-categor{impact.children.length === 1 ? 'y is' : 'ies are'} inside it (
                  {impact.children.map((child) => child.name).join(', ')}). What should happen to{' '}
                  {impact.children.length === 1 ? 'it' : 'them'}?
                </label>
                <select
                  id="move-children"
                  value={moveChildrenTo}
                  onChange={(e) => setMoveChildrenTo(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Keep as main categories (shown on the homepage)</option>
                  {childTargets.map((option) => (
                    <option key={option.value} value={option.value}>
                      Move under “{option.label}”
                    </option>
                  ))}
                </select>
                {childProducts > 0 && (
                  <p className="text-xs text-ink-muted">
                    Their {childProducts} product{childProducts === 1 ? '' : 's'} stay with them.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {submitError && (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
            {submitError}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="min-h-[48px] rounded-lg border border-charcoal/20 px-5 text-sm font-medium text-charcoal hover:bg-charcoal/5 disabled:opacity-50"
          >
            No, keep it
          </button>
          <button
            type="button"
            onClick={() =>
              onConfirm({
                moveProductsTo: moveProductsTo || null,
                moveChildrenTo: moveChildrenTo || null,
              })
            }
            disabled={!canConfirm || noTargetAvailable}
            className="min-h-[48px] rounded-lg bg-red-700 px-5 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
          >
            {busy ? 'Deleting…' : 'Yes, delete it'}
          </button>
        </div>
      </div>
    </div>
  );
}
