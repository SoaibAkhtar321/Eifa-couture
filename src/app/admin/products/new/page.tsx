import { createClient } from '@/lib/supabase/server';
import ProductForm from '@/components/admin/products/ProductForm';
import type { DbCategory, DbFabric } from '@/types/database';

export const metadata = { title: 'New Product' };

async function getFormOptions(): Promise<{ categories: DbCategory[]; fabrics: DbFabric[] }> {
  const supabase = await createClient();

  const [{ data: categories }, { data: fabrics }] = await Promise.all([
    supabase.from('categories').select('*').is('deleted_at', null).order('name', { ascending: true }),
    supabase.from('fabrics').select('*').eq('is_active', true).order('name', { ascending: true }),
  ]);

  return {
    categories: (categories ?? []) as DbCategory[],
    fabrics: (fabrics ?? []) as DbFabric[],
  };
}

export default async function NewProductPage() {
  const { categories, fabrics } = await getFormOptions();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl text-maroon">Add product</h1>
        <p className="text-ink-muted mt-1">
          Fill in the basics, add photos, and the product goes live in the right part of the store.
        </p>
      </div>

      <ProductForm categories={categories} fabrics={fabrics} />
    </div>
  );
}
