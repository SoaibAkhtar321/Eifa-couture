import { notFound } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import CategoryForm from '@/components/admin/categories/CategoryForm';
import type { DbCategory } from '@/types/database';

export const metadata = { title: 'Edit Category' };

interface EditCategoryPageProps {
  params: Promise<{ id: string }>;
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

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: category, error }, categories] = await Promise.all([
    supabase.from('categories').select('*').eq('id', id).is('deleted_at', null).single(),
    getCategories(),
  ]);

  if (error || !category) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl text-maroon">{(category as DbCategory).name}</h1>
        <p className="text-charcoal/60 mt-1">Edit category details.</p>
      </div>

      <CategoryForm category={category as DbCategory} categories={categories} />
    </div>
  );
}