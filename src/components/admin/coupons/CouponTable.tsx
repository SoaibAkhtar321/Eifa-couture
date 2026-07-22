'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import DataTable, { type DataTableColumn } from '@/components/admin/DataTable';
import { formatPrice } from '@/lib/utils';
import { deleteCoupon, setCouponActive } from '@/lib/admin/coupons-write';
import type { DbCoupon } from '@/types/database';

interface CouponTableProps {
  rows: DbCoupon[];
  error: string | null;
}

function formatValue(row: DbCoupon): string {
  return row.type === 'percentage' ? `${row.value}%` : formatPrice(row.value);
}

function isExpired(row: DbCoupon): boolean {
  return Boolean(row.expires_at) && new Date(row.expires_at as string) < new Date();
}

export default function CouponTable({ rows, error }: CouponTableProps) {
  const router = useRouter();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleToggleActive(row: DbCoupon) {
    setActionError(null);
    setPendingToggleId(row.id);
    const { error: toggleErr } = await setCouponActive(row.id, !row.is_active);
    setPendingToggleId(null);

    if (toggleErr) {
      setActionError(toggleErr);
      return;
    }
    router.refresh();
  }

  async function handleDelete(row: DbCoupon) {
    setActionError(null);
    const confirmed = window.confirm(`Delete coupon "${row.code}"? This cannot be undone.`);
    if (!confirmed) return;

    setPendingDeleteId(row.id);
    const { error: deleteErr } = await deleteCoupon(row.id);
    setPendingDeleteId(null);

    if (deleteErr) {
      setActionError(deleteErr);
      return;
    }
    router.refresh();
  }

  const columns: DataTableColumn<DbCoupon>[] = [
    {
      key: 'code',
      header: 'Code',
      render: (row) => <p className="font-medium text-charcoal">{row.code}</p>,
    },
    {
      key: 'value',
      header: 'Discount',
      render: (row) => formatValue(row),
    },
    {
      key: 'min_order',
      header: 'Min. order',
      render: (row) => (row.min_order ? formatPrice(row.min_order) : <span className="text-charcoal/40">—</span>),
    },
    {
      key: 'usage',
      header: 'Usage',
      render: (row) => `${row.used_count}${row.usage_limit ? ` / ${row.usage_limit}` : ''}`,
    },
    {
      key: 'expires',
      header: 'Expires',
      render: (row) =>
        row.expires_at ? (
          <span className={isExpired(row) ? 'text-red-600' : ''}>
            {new Date(row.expires_at).toLocaleDateString('en-IN')}
          </span>
        ) : (
          <span className="text-charcoal/40">Never</span>
        ),
    },
    {
      key: 'active',
      header: 'Status',
      render: (row) => (
        <button
          type="button"
          disabled={pendingToggleId === row.id}
          onClick={(e) => {
            e.stopPropagation();
            void handleToggleActive(row);
          }}
          className={`rounded-full px-2.5 py-1 text-xs font-medium transition disabled:opacity-50 ${
            row.is_active ? 'bg-green-100 text-green-800' : 'bg-charcoal/10 text-charcoal/50'
          }`}
        >
          {row.is_active ? 'Active' : 'Inactive'}
        </button>
      ),
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
              router.push(`/admin/coupons/${row.id}/edit`);
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
      {actionError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError}</div>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        error={error}
        emptyMessage="No coupons yet."
        onRowClick={(row) => router.push(`/admin/coupons/${row.id}/edit`)}
      />
    </div>
  );
}
