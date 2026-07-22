import { listCustomers } from '@/lib/admin/customers-read';
import CustomerTable from '@/components/admin/customers/CustomerTable';

export const metadata = { title: 'Customers' };

interface CustomersPageProps {
  searchParams: Promise<{
    q?: string;
    status?: 'active' | 'inactive';
    sort?: 'newest' | 'oldest' | 'name';
    page?: string;
  }>;
}

export default async function AdminCustomersPage({ searchParams }: CustomersPageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? '1') || 1;

  const { data: result, error } = await listCustomers({
    search: params.q,
    isActive: params.status === 'active' ? true : params.status === 'inactive' ? false : undefined,
    sort: params.sort ?? 'newest',
    page,
    pageSize: 20,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl text-maroon">Customers</h1>
        <p className="text-charcoal/60 mt-1">
          {result ? `${result.totalCount.toLocaleString('en-IN')} customer${result.totalCount === 1 ? '' : 's'}` : ''}
        </p>
      </div>

      <CustomerTable
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
