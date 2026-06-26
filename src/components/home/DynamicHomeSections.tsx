import FeaturedCategorySection from '@/components/home/FeaturedCategorySection';

import { getActiveHomeSections } from '@/lib/home-sections';

export default function DynamicHomeSections() {
  const sections = getActiveHomeSections();

  if (sections.length === 0) return null;

  return (
    <>
      {sections.map((section) => {
        if (section.type === 'featured-category') {
          return <FeaturedCategorySection key={section.id} section={section} />;
        }

        return null;
      })}
    </>
  );
}