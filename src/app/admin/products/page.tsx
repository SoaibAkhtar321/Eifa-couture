import Link from 'next/link';

import { createClient } from '@/lib/supabase/server';
import { listProducts, listProductsNeedingPhotos } from '@/lib/admin/products-read';
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

  const [{ data: result, error }, categories, needPhotos] = await Promise.all([
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
    listProductsNeedingPhotos(),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl text-maroon">Products</h1>
          <p className="text-ink-muted mt-1">
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

      {needPhotos.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900" role="status">
          <p className="font-medium">
            Needs more photos: {needPhotos.length} live product{needPhotos.length === 1 ? ' has' : 's have'} fewer than 3 photos.
          </p>
          <p className="mt-1 text-xs">They stay live. Open each one and add front, back and a close-up of the embroidery.</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {needPhotos.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/admin/products/${p.id}/edit`}
                  className="inline-block rounded-full border border-amber-400 bg-white px-3 py-1 text-xs hover:bg-amber-100"
                >
                  {p.name} ({p.image_count} of 3)
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

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
