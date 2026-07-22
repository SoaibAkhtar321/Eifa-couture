'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import DataTable, { type DataTableColumn } from '@/components/admin/DataTable';
import { deleteBanner, setBannerActive } from '@/lib/admin/banners-write';
import { deleteBannerImages } from '@/lib/admin/banners-storage';
import type { DbBanner } from '@/types/database';

interface BannerTableProps {
  rows: DbBanner[];
  error: string | null;
}

export default function BannerTable({ rows, error }: BannerTableProps) {
  const router = useRouter();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleDelete(row: DbBanner) {
    setActionError(null);
    const confirmed = window.confirm(`Delete "${row.title}"? This can't be undone.`);
    if (!confirmed) return;

    setPendingDeleteId(row.id);
    const { error: deleteErr } = await deleteBanner(row.id);

    if (deleteErr) {
      setPendingDeleteId(null);
      setActionError(deleteErr);
      return;
    }

    await deleteBannerImages([row.image_url, row.mobile_image_url]);
    setPendingDeleteId(null);
    router.refresh();
  }

  async function handleToggleActive(row: DbBanner) {
    setActionError(null);
    setPendingToggleId(row.id);
    const { error: toggleErr } = await setBannerActive(row.id, !row.is_active);
    setPendingToggleId(null);

    if (toggleErr) {
      setActionError(toggleErr);
      return;
    }
    router.refresh();
  }

  const columns: DataTableColumn<DbBanner>[] = [
    {
      key: 'banner',
      header: 'Banner',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-md border border-charcoal/10 bg-beige/40">
            <Image src={row.image_url} alt={row.title} fill className="object-cover" />
          </div>
          <div>
            <p className="font-medium text-charcoal">{row.title}</p>
            {row.subtitle && <p className="text-xs text-charcoal/50 line-clamp-1">{row.subtitle}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'sort_order',
      header: 'Sort',
      render: (row) => row.sort_order,
    },
    {
      key: 'schedule',
      header: 'Schedule',
      render: (row) =>
        row.starts_at || row.ends_at ? (
          <span className="text-xs text-charcoal/60">
            {row.starts_at ? new Date(row.starts_at).toLocaleDateString('en-IN') : 'Now'} –{' '}
            {row.ends_at ? new Date(row.ends_at).toLocaleDateString('en-IN') : 'Ongoing'}
          </span>
        ) : (
          <span className="text-xs text-charcoal/40">Always on</span>
        ),
    },
    {
      key: 'status',
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
            row.is_active ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-charcoal/10 text-charcoal/50 hover:bg-charcoal/15'
          }`}
        >
          {pendingToggleId === row.id ? '…' : row.is_active ? 'Active' : 'Inactive'}
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
              router.push(`/admin/banners/${row.id}/edit`);
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
        emptyMessage="No banners yet."
        onRowClick={(row) => router.push(`/admin/banners/${row.id}/edit`)}
      />
    </div>
  );
}
