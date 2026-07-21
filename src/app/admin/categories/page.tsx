import Link from 'next/link';

import { createClient } from '@/lib/supabase/server';
import CategoryTable from '@/components/admin/categories/CategoryTable';
import type { DbCategory } from '@/types/database';

export const metadata = { title: 'Categories' };

async function getCategories(): Promise<{ data: DbCategory[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  return { data: (data ?? []) as DbCategory[], error: error?.message ?? null };
}

export default async function AdminCategoriesPage() {
  const { data: categories, error } = await getCategories();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl text-maroon">Categories</h1>
          <p className="text-charcoal/60 mt-1">
            {categories.length} categor{categories.length === 1 ? 'y' : 'ies'}
          </p>
        </div>
        <Link
          href="/admin/categories/new"
          className="rounded-lg bg-maroon px-5 py-2.5 text-sm font-medium text-ivory transition hover:bg-maroon/90"
        >
          Add category
        </Link>
      </div>

      <CategoryTable rows={categories} error={error} />
    </div>
  );
}