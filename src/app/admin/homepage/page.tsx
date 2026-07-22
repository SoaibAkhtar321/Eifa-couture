import Link from 'next/link';

import DataTable, { type DataTableColumn } from '@/components/admin/DataTable';
import { listHomepageSections } from '@/lib/data/homepage-sections';
import type { DbHomepageSection, HomepageSectionKey } from '@/types/database';

export const metadata = { title: 'Homepage CMS' };

const SECTION_LABELS: Record<HomepageSectionKey, string> = {
  featured_collection: 'Featured Collections',
  new_arrivals: 'New Arrivals',
  best_sellers: 'Best Sellers',
  shop_by_category: 'Shop By Category',
};

export default async function AdminHomepagePage() {
  const { data: sections, error } = await listHomepageSections();

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
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl text-maroon">Homepage CMS</h1>
        <p className="text-charcoal/60 mt-1">
          Control which sections appear on the homepage, their order, copy, and item counts.
        </p>
      </div>

      <DataTable
        columns={columns}
        rows={sections ?? []}
        getRowKey={(row) => row.id}
        error={error}
        emptyMessage="No homepage sections found."
      />
    </div>
  );
}
