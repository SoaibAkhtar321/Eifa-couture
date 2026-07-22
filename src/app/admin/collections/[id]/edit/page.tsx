import { notFound } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import CollectionForm from '@/components/admin/collections/CollectionForm';
import CollectionProductsManager from '@/components/admin/collections/CollectionProductsManager';
import type { DbCollection } from '@/types/database';

export const metadata = { title: 'Edit Collection' };

interface EditCollectionPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCollectionPage({ params }: EditCollectionPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: collection, error } = await supabase
    .from('collections')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error || !collection) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl text-maroon">{(collection as DbCollection).name}</h1>
        <p className="text-charcoal/60 mt-1">Edit collection details.</p>
      </div>

      <CollectionForm collection={collection as DbCollection} />

      <CollectionProductsManager collectionId={id} />
    </div>
  );
}
