import { listInventory, getInventorySummary } from '@/lib/admin/inventory-read';
import InventoryTable from '@/components/admin/inventory/InventoryTable';
import StatCard from '@/components/admin/StatCard';

export const metadata = { title: 'Inventory' };

interface InventoryPageProps {
  searchParams: Promise<{
    q?: string;
    stock?: 'low' | 'out';
    sort?: 'stock_asc' | 'stock_desc' | 'name' | 'updated';
    page?: string;
  }>;
}

export default async function AdminInventoryPage({ searchParams }: InventoryPageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? '1') || 1;

  const [{ data: result, error }, { data: summary }] = await Promise.all([
    listInventory({
      search: params.q,
      stockFilter: params.stock,
      sort: params.sort ?? 'stock_asc',
      page,
      pageSize: 20,
    }),
    getInventorySummary(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl text-maroon">Inventory</h1>
        <p className="text-charcoal/60 mt-1">Track and update stock across every product variant.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tracked variants" value={(summary?.totalVariants ?? 0).toLocaleString('en-IN')} />
        <StatCard label="Units in stock" value={(summary?.totalUnits ?? 0).toLocaleString('en-IN')} />
        <StatCard
          label="Low stock"
          value={(summary?.lowStockCount ?? 0).toLocaleString('en-IN')}
          tone={(summary?.lowStockCount ?? 0) > 0 ? 'warning' : 'default'}
        />
        <StatCard
          label="Out of stock"
          value={(summary?.outOfStockCount ?? 0).toLocaleString('en-IN')}
          tone={(summary?.outOfStockCount ?? 0) > 0 ? 'warning' : 'default'}
        />
      </div>

      <InventoryTable
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
