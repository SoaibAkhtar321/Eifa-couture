import CollectionForm from '@/components/admin/collections/CollectionForm';

export const metadata = { title: 'New Collection' };

export default function NewCollectionPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl text-maroon">Add collection</h1>
        <p className="text-charcoal/60 mt-1">
          Collections are editorial groupings of products — e.g. seasonal or campaign edits.
        </p>
      </div>

      <CollectionForm />
    </div>
  );
}
