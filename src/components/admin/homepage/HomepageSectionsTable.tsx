'use client';

import Link from 'next/link';

import DataTable, { type DataTableColumn } from '@/components/admin/DataTable';
import type { DbHomepageSection, HomepageSectionKey } from '@/types/database';

const SECTION_LABELS: Record<HomepageSectionKey, string> = {
  featured_collection: 'Featured Collections',
  new_arrivals: 'New Arrivals',
  best_sellers: 'Best Sellers',
  shop_by_category: 'Shop By Category',
};

interface HomepageSectionsTableProps {
  rows: DbHomepageSection[];
  error: string | null;
}

export default function HomepageSectionsTable({ rows, error }: HomepageSectionsTableProps) {
  const columns: DataTableColumn<DbHomepageSection>[] = [
    {
      key: 'section',
      header: 'Section',
      render: (row) => (
        <div>
          <p className="font-medium text-charcoal">{SECTION_LABELS[row.section_key]}</p>
          <p className="text-xs text-charcoal/50">{row.title || 'Uses default heading'}</p>
        </div>
      ),
    },
    {
      key: 'order',
      header: 'Order',
      render: (row) => row.sort_order,
    },
    {
      key: 'items',
      header: 'Items shown',
      render: (row) => row.item_limit,
    },
    {
      key: 'status',
      header: 'Status',
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
      key: 'actions',
      header: '',
      className: 'w-20 text-right',
      render: (row) => (
        <Link href={`/admin/homepage/${row.id}/edit`} className="text-sm font-medium text-maroon hover:underline">
          Edit
        </Link>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      error={error}
      emptyMessage="No homepage sections found."
    />
  );
}
