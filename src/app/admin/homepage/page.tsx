import AudiencePanelsForm, { type AudiencePanelState } from '@/components/admin/homepage/AudiencePanelsForm';
import HomepageSectionsTable from '@/components/admin/homepage/HomepageSectionsTable';
import { getAudienceContent } from '@/lib/audience-content';
import { getAudiencePanelImages } from '@/lib/data/audience-panels';
import { listHomepageSections } from '@/lib/data/homepage-sections';

export const metadata = { title: 'Homepage' };

const PANELS: { audience: AudiencePanelState['audience']; label: string }[] = [
  { audience: 'women', label: 'Women' },
  { audience: 'men', label: 'Men' },
  { audience: 'accessories', label: 'Accessories' },
];

export default async function AdminHomepagePage() {
  const [{ data: sections, error }, panelImages] = await Promise.all([
    listHomepageSections(),
    getAudiencePanelImages(),
  ]);

  const panels: AudiencePanelState[] = PANELS.map(({ audience, label }) => {
    const custom = panelImages[audience];
    return {
      audience,
      label,
      currentImage: getAudienceContent(audience, custom).image,
      isCustom: custom !== null,
    };
  });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-heading text-3xl text-maroon">Homepage</h1>
        <p className="text-ink-muted mt-1">
          Change the pictures, and control which sections appear on the homepage, their order, text and item counts.
        </p>
      </div>

      <AudiencePanelsForm panels={panels} />

      <section aria-labelledby="sections-heading" className="space-y-4">
        <h2 id="sections-heading" className="font-heading text-xl text-maroon">
          Homepage sections
        </h2>
        <HomepageSectionsTable rows={sections ?? []} error={error} />
      </section>
    </div>
  );
}
