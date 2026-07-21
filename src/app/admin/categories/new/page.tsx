import { createClient } from '@/lib/supabase/server';
import CategoryForm from '@/components/admin/categories/CategoryForm';
import type { DbCategory } from '@/types/database';

export const metadata = { title: 'New Category' };

async function getCategories(): Promise<DbCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('categories')
    .select('*')
    .is('deleted_at', null)
    .order('name', { ascending: true });

  return (data ?? []) as DbCategory[];
}

export default async function NewCategoryPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl text-maroon">Add category</h1>
        <p className="text-charcoal/60 mt-1">Categories organize products for browsing, filtering, and navigation.</p>
      </div>

      <CategoryForm categories={categories} />
    </div>
  );
}