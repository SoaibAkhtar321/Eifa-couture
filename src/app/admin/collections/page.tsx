import Link from 'next/link';

import { listCollections } from '@/lib/admin/collections-read';
import CollectionTable from '@/components/admin/collections/CollectionTable';

export const metadata = { title: 'Collections' };

interface CollectionsPageProps {
  searchParams: Promise<{
    q?: string;
    status?: 'active' | 'inactive';
    page?: string;
  }>;
}

export default async function AdminCollectionsPage({ searchParams }: CollectionsPageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? '1') || 1;

  const { data: result, error } = await listCollections({
    search: params.q,
    isActive: params.status === 'active' ? true : params.status === 'inactive' ? false : undefined,
    page,
    pageSize: 20,
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl text-maroon">Collections</h1>
          <p className="text-charcoal/60 mt-1">
            {result ? `${result.totalCount.toLocaleString('en-IN')} collection${result.totalCount === 1 ? '' : 's'}` : ''}
          </p>
        </div>
        <Link
          href="/admin/collections/new"
          className="rounded-lg bg-maroon px-5 py-2.5 text-sm font-medium text-ivory transition hover:bg-maroon/90"
        >
          Add collection
        </Link>
      </div>

      <CollectionTable
        rows={result?.rows ?? []}
        totalCount={result?.totalCount ?? 0}
        page={result?.page ?? page}
        pageSize={result?.pageSize ?? 20}
        currentParams={params}
        error={error}
      />
    </div>
  );
}
