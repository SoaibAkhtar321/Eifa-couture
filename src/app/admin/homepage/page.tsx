import HomepageSectionsTable from '@/components/admin/homepage/HomepageSectionsTable';
import { listHomepageSections } from '@/lib/data/homepage-sections';

export const metadata = { title: 'Homepage CMS' };

export default async function AdminHomepagePage() {
  const { data: sections, error } = await listHomepageSections();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl text-maroon">Homepage CMS</h1>
        <p className="text-charcoal/60 mt-1">
          Control which sections appear on the homepage, their order, copy, and item counts.
        </p>
      </div>

      <HomepageSectionsTable rows={sections ?? []} error={error} />
    </div>
  );
}
