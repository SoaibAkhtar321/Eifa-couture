'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import CategoryDeleteDialog from '@/components/admin/categories/CategoryDeleteDialog';
import DataTable, { type DataTableColumn } from '@/components/admin/DataTable';
import { useToast } from '@/components/admin/ui/Toaster';
import CategoryPlaceholder from '@/components/ui/CategoryPlaceholder';
import {
  deleteCategoryAction,
  getCategoryDeleteImpactAction,
  reorderCategoriesAction,
  type CategoryDeleteImpact,
} from '@/lib/admin/categories-actions';
import { AUDIENCE_OPTIONS } from '@/lib/catalog';
import type { DbCategory } from '@/types/database';

interface CategoryTableProps {
  rows: DbCategory[];
  /** category id -> number of products. null when counts could not be loaded. */
  productCounts: Record<string, number> | null;
  error: string | null;
}

const AUDIENCE_LABELS = new Map<string, string>(AUDIENCE_OPTIONS.map((o) => [o.value, o.label]));

function bySortThenName(a: DbCategory, b: DbCategory) {
  return a.sort_order - b.sort_order || a.name.localeCompare(b.name);
}

interface DeleteState {
  category: DbCategory;
  impact: CategoryDeleteImpact | null;
  loadError: string | null;
  submitError: string | null;
  busy: boolean;
}

export default function CategoryTable({ rows, productCounts, error }: CategoryTableProps) {
  const router = useRouter();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [isReordering, setIsReordering] = useState(false);
  const [dialog, setDialog] = useState<DeleteState | null>(null);

  const nameById = useMemo(() => new Map(rows.map((c) => [c.id, c.name])), [rows]);

  // Main categories first, each followed by its sub-categories.
  const ordered = useMemo(() => {
    const ids = new Set(rows.map((c) => c.id));
    const isTop = (c: DbCategory) => !c.parent_id || !ids.has(c.parent_id);
    const tops = rows.filter(isTop).sort(bySortThenName);
    const result: DbCategory[] = [];
    for (const top of tops) {
      result.push(top);
      result.push(...rows.filter((c) => c.parent_id === top.id).sort(bySortThenName));
    }
    return result;
  }, [rows]);

  const searchText = query.trim().toLowerCase();
  const visible = useMemo(() => {
    if (!searchText) return ordered;
    return ordered.filter((c) => {
      const haystack = [
        c.name,
        c.slug,
        c.audience ? AUDIENCE_LABELS.get(c.audience) ?? c.audience : '',
        c.parent_id ? nameById.get(c.parent_id) ?? '' : '',
        c.is_active ? 'active' : 'hidden inactive',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(searchText);
    });
  }, [ordered, searchText, nameById]);

  const canReorder = !searchText && !isReordering;

  function siblingsOf(row: DbCategory): DbCategory[] {
    return rows.filter((c) => (c.parent_id ?? null) === (row.parent_id ?? null)).sort(bySortThenName);
  }

  async function move(row: DbCategory, direction: -1 | 1) {
    const siblings = siblingsOf(row);
    const index = siblings.findIndex((c) => c.id === row.id);
    const target = index + direction;
    if (index === -1 || target < 0 || target >= siblings.length) return;

    const next = [...siblings];
    [next[index], next[target]] = [next[target], next[index]];

    setIsReordering(true);
    const parentLabel = row.parent_id ? `Sub-categories of ${nameById.get(row.parent_id) ?? 'category'}` : 'Main categories';
    const { error: reorderError } = await reorderCategoriesAction(
      next.map((c) => c.id),
      parentLabel
    );
    setIsReordering(false);

    if (reorderError) {
      toast.error(reorderError);
      return;
    }
    toast.success('Order saved');
    router.refresh();
  }

  async function openDelete(row: DbCategory) {
    setDialog({ category: row, impact: null, loadError: null, submitError: null, busy: false });
    const { data, error: impactError } = await getCategoryDeleteImpactAction(row.id);
    setDialog((current) =>
      current && current.category.id === row.id
        ? { ...current, impact: data, loadError: impactError }
        : current
    );
  }

  async function confirmDelete(choice: { moveProductsTo: string | null; moveChildrenTo: string | null }) {
    if (!dialog) return;
    const target = dialog.category;
    setDialog({ ...dialog, busy: true, submitError: null });

    const { error: deleteError } = await deleteCategoryAction({ id: target.id, ...choice });
    if (deleteError) {
      setDialog((current) => (current ? { ...current, busy: false, submitError: deleteError } : current));
      return;
    }

    setDialog(null);
    toast.success(`“${target.name}” deleted`);
    router.refresh();
  }

  const productTargets = dialog
    ? rows
        .filter((c) => c.id !== dialog.category.id && c.is_active)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((c) => ({
          value: c.id,
          label: c.parent_id ? `${nameById.get(c.parent_id) ?? ''} › ${c.name}` : c.name,
        }))
    : [];
  const childTargets = dialog
    ? rows
        .filter((c) => c.id !== dialog.category.id && !c.parent_id && c.is_active)
        .sort(bySortThenName)
        .map((c) => ({ value: c.id, label: c.name }))
    : [];

  const columns: DataTableColumn<DbCategory>[] = [
    {
      key: 'picture',
      header: 'Picture',
      render: (row) => (
        <div className="relative h-14 w-11 overflow-hidden rounded-md bg-charcoal ring-1 ring-gold-deep/30">
          {row.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail
            <img src={row.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <CategoryPlaceholder name={row.name} size="thumb" />
          )}
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <div className={row.parent_id ? 'pl-4' : ''}>
          <p className="font-medium text-charcoal">
            {row.parent_id && <span className="mr-1 text-ink-muted">↳</span>}
            {row.name}
          </p>
          <p className="text-xs text-ink-muted">{row.slug}</p>
        </div>
      ),
    },
    {
      key: 'audience',
      header: 'For',
      render: (row) => (row.audience ? AUDIENCE_LABELS.get(row.audience) ?? row.audience : <span className="text-ink-muted">—</span>),
    },
    {
      key: 'parent',
      header: 'Parent',
      render: (row) =>
        row.parent_id ? nameById.get(row.parent_id) ?? '—' : <span className="text-ink-muted">Main category</span>,
    },
    {
      key: 'products',
      header: 'Products',
      render: (row) => (productCounts ? (productCounts[row.id] ?? 0) : <span className="text-ink-muted">—</span>),
    },
    {
      key: 'order',
      header: 'Order',
      render: (row) => {
        const siblings = siblingsOf(row);
        const index = siblings.findIndex((c) => c.id === row.id);
        return (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              disabled={!canReorder || index <= 0}
              onClick={() => void move(row, -1)}
              aria-label={`Move ${row.name} up`}
              className="flex h-10 w-10 items-center justify-center rounded text-charcoal hover:bg-charcoal/10 disabled:opacity-30"
            >
              ▲
            </button>
            <button
              type="button"
              disabled={!canReorder || index === -1 || index >= siblings.length - 1}
              onClick={() => void move(row, 1)}
              aria-label={`Move ${row.name} down`}
              className="flex h-10 w-10 items-center justify-center rounded text-charcoal hover:bg-charcoal/10 disabled:opacity-30"
            >
              ▼
            </button>
            <span className="ml-1 text-xs text-ink-muted">{row.sort_order}</span>
          </div>
        );
      },
    },
    {
      key: 'active',
      header: 'Status',
      render: (row) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            row.is_active ? 'bg-green-100 text-green-800' : 'bg-charcoal/10 text-ink-muted'
          }`}
        >
          {row.is_active ? 'Showing' : 'Hidden'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/categories/${row.id}/edit`);
            }}
            className="min-h-[44px] px-2 text-sm font-medium text-maroon hover:underline"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void openDelete(row);
            }}
            className="min-h-[44px] px-2 text-sm font-medium text-red-600 hover:underline"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, web address, Women / Men…"
          aria-label="Search categories"
          className="w-full rounded-md border border-charcoal/15 bg-ivory px-3 py-2.5 text-sm text-charcoal placeholder:text-ink-muted focus:border-maroon focus:outline-none focus:ring-2 focus:ring-maroon/30 sm:max-w-sm"
        />
        <p className="text-xs text-ink-muted">
          {searchText
            ? `Showing ${visible.length} of ${rows.length}. Clear the search to change the order.`
            : 'Use ▲ ▼ to change the order shoppers see. Hidden categories are listed too.'}
        </p>
      </div>

      <DataTable
        columns={columns}
        rows={visible}
        getRowKey={(row) => row.id}
        error={error}
        emptyMessage={searchText ? 'No categories match your search.' : 'No categories yet.'}
        onRowClick={(row) => router.push(`/admin/categories/${row.id}/edit`)}
      />

      {dialog && (
        <CategoryDeleteDialog
          name={dialog.category.name}
          impact={dialog.impact}
          loadError={dialog.loadError}
          submitError={dialog.submitError}
          busy={dialog.busy}
          productTargets={productTargets}
          childTargets={childTargets}
          onConfirm={(choice) => void confirmDelete(choice)}
          onCancel={() => setDialog(null)}
        />
      )}
    </div>
  );
}
