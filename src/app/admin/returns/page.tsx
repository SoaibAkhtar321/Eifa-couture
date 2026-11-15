import { requireAdmin } from '@/lib/admin/auth';
import { listReturns, parseReturnInboxFilter } from '@/lib/admin/returns-inbox';
import ReturnsInboxTable from '@/components/admin/returns/ReturnsInboxTable';

export const metadata = { title: 'Returns' };

interface ReturnsPageProps {
  searchParams: Promise<{
    status?: string;
    q?: string;
    page?: string;
  }>;
}

export default async function AdminReturnsPage({ searchParams }: ReturnsPageProps) {
  // Re-check the role here as well as in the admin layout.
  await requireAdmin('/admin/returns');

  const params = await searchParams;
  const filter = parseReturnInboxFilter(params.status);
  const page = Number(params.page ?? '1') || 1;

  const { data: result, error } = await listReturns({
    filter,
    search: params.q,
    page,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl text-maroon">Returns</h1>
        <p className="text-ink-muted mt-1">
          {result
            ? `${result.totalCount.toLocaleString('en-IN')} return${result.totalCount === 1 ? '' : 's'}`
            : ''}
        </p>
      </div>

      <ReturnsInboxTable
        rows={result?.rows ?? []}
        totalCount={result?.totalCount ?? 0}
        page={result?.page ?? page}
        pageSize={result?.pageSize ?? 20}
        filter={filter}
        search={params.q ?? ''}
        error={error}
      />
    </div>
  );
}
