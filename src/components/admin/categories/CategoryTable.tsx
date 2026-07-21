'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import DataTable, { type DataTableColumn } from '@/components/admin/DataTable';
import { softDeleteCategory } from '@/lib/admin/categories-write';
import type { DbCategory } from '@/types/database';

interface CategoryTableProps {
  rows: DbCategory[];
  error: string | null;
}

export default function CategoryTable({ rows, error }: CategoryTableProps) {
  const router = useRouter();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const nameById = new Map(rows.map((c) => [c.id, c.name]));

  async function handleDelete(row: DbCategory) {
    setDeleteError(null);
    const confirmed = window.confirm(
      `Delete "${row.name}"? Products already assigned to it will keep their category reference, but it will no longer appear as an option.`
    );
    if (!confirmed) return;

    setPendingDeleteId(row.id);
    const { error: deleteErr } = await softDeleteCategory(row.id);
    setPendingDeleteId(null);

    if (deleteErr) {
      setDeleteError(deleteErr);
      return;
    }
    router.refresh();
  }

  const columns: DataTableColumn<DbCategory>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <div>
          <p className="font-medium text-charcoal">{row.name}</p>
          <p className="text-xs text-charcoal/50">{row.slug}</p>
        </div>
      ),
    },
    {
      key: 'parent',
      header: 'Parent',
      render: (row) => (row.parent_id ? nameById.get(row.parent_id) ?? '—' : <span className="text-charcoal/40">—</span>),
    },
    {
      key: 'sort_order',
      header: 'Sort',
      render: (row) => row.sort_order,
    },
    {
      key: 'active',
      header: 'Active',
      render: (row) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            row.is_active ? 'bg-green-100 text-green-800' : 'bg-charcoal/10 text-charcoal/50'
          }`}
        >
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'updated',
      header: 'Updated',
      render: (row) => new Date(row.updated_at).toLocaleDateString('en-IN'),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/categories/${row.id}/edit`);
            }}
            className="text-sm font-medium text-maroon hover:underline"
          >
            Edit
          </button>
          <button
            type="button"
            disabled={pendingDeleteId === row.id}
            onClick={(e) => {
              e.stopPropagation();
              void handleDelete(row);
            }}
            className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
          >
            {pendingDeleteId === row.id ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {deleteError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{deleteError}</div>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        error={error}
        emptyMessage="No categories yet."
        onRowClick={(row) => router.push(`/admin/categories/${row.id}/edit`)}
      />
    </div>
  );
}