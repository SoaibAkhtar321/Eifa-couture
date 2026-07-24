import { listOrders } from '@/lib/admin/orders';
import OrderTable from '@/components/admin/orders/OrderTable';
import type { OrderStatus, PaymentStatus } from '@/types/database';

export const metadata = { title: 'Orders' };

interface OrdersPageProps {
  searchParams: Promise<{
    q?: string;
    status?: OrderStatus;
    payment?: PaymentStatus;
    sort?: 'newest' | 'oldest' | 'total_desc' | 'total_asc';
    from?: string;
    to?: string;
    page?: string;
  }>;
}

export default async function AdminOrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? '1') || 1;

  const { data: result, error } = await listOrders({
    search: params.q,
    status: params.status,
    paymentStatus: params.payment,
    dateFrom: params.from,
    dateTo: params.to,
    sort: params.sort ?? 'newest',
    page,
    pageSize: 20,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl text-maroon">Orders</h1>
        <p className="text-charcoal/60 mt-1">
          {result ? `${result.totalCount.toLocaleString('en-IN')} order${result.totalCount === 1 ? '' : 's'}` : ''}
        </p>
      </div>

      <OrderTable
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
