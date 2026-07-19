import Link from 'next/link';

import { createClient } from '@/lib/supabase/server';
import { listProducts } from '@/lib/admin/products';
import ProductTable from '@/components/admin/products/ProductTable';
import type { DbCategory } from '@/types/database';

export const metadata = { title: 'Products' };

interface ProductsPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    status?: 'active' | 'inactive';
    featured?: '1';
    lowStock?: '1';
    sort?: 'newest' | 'updated' | 'name' | 'price';
    page?: string;
  }>;
}

async function getCategories(): Promise<DbCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('categories')
    .select('*')
    .is('deleted_at', null)
    .order('name', { ascending: true });

  return (data ?? []) as DbCategory[];
}

export default async function AdminProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? '1') || 1;

  const [{ data: result, error }, categories] = await Promise.all([
    listProducts({
      search: params.q,
      categoryId: params.category,
      isActive: params.status === 'active' ? true : params.status === 'inactive' ? false : undefined,
      isFeatured: params.featured === '1' ? true : undefined,
      lowStockOnly: params.lowStock === '1',
      sort: params.sort ?? 'newest',
      page,
      pageSize: 20,
    }),
    getCategories(),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl text-maroon">Products</h1>
          <p className="text-charcoal/60 mt-1">
            {result ? `${result.totalCount.toLocaleString('en-IN')} product${result.totalCount === 1 ? '' : 's'}` : ''}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-maroon px-5 py-2.5 text-sm font-medium text-ivory transition hover:bg-maroon/90"
        >
          Add product
        </Link>
      </div>

      <ProductTable
        rows={result?.rows ?? []}
        totalCount={result?.totalCount ?? 0}
        page={result?.page ?? page}
        pageSize={result?.pageSize ?? 20}
        categories={categories}
        currentParams={params}
        error={error}
      />
    </div>
  );
}
