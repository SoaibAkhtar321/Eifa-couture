import { notFound } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { getProduct } from '@/lib/admin/products-read';
import ProductForm from '@/components/admin/products/ProductForm';
import type { DbCategory, DbFabric } from '@/types/database';

export const metadata = { title: 'Edit Product' };

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

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

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;

  const [{ data: product, error }, { categories, fabrics }] = await Promise.all([
    getProduct(id),
    getFormOptions(),
  ]);

  if (error || !product) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl text-maroon">{product.name}</h1>
        <p className="text-charcoal/60 mt-1">Edit product details, variants, and images.</p>
      </div>

      <ProductForm product={product} categories={categories} fabrics={fabrics} />
    </div>
  );
}
