import type { FeaturedCategorySectionData } from '@/components/home/FeaturedCategorySection';

export type HomeSectionType = 'featured-category';

export type HomeSection = FeaturedCategorySectionData & {
  type: HomeSectionType;
  order: number;
  showOnHomepage: boolean;
  categorySlug?: string;
};

/*
  Temporary data source.

  Later, admin panel will save this same structure in database.
  Then we will replace this array with a database fetch.
*/
export const MOCK_HOME_SECTIONS: HomeSection[] = [
  {
    id: 'section-crochet-silk-bags',
    type: 'featured-category',
    order: 1,
    showOnHomepage: true,
    isActive: true,

    categorySlug: 'crochet-bags',
    eyebrow: 'Accessories',
    title: 'Crochet Silk',
    highlightedTitle: 'Bags',
    description:
      'Handcrafted crochet bags made with a refined silk finish, designed to complete ethnic and festive looks with elegance.',
    secondaryDescription:
      'Lightweight, graceful, and statement-worthy — these bags pair beautifully with Chikankari kurtas, sarees, festive sets, and occasion wear.',
    imageUrl: '/images/categories/dupattas.png',
    imageAlt: 'Crochet silk bags by Eifa Couture',
    href: '/shop?category=crochet-bags',
    primaryCta: 'Shop Bags',
    secondaryCta: 'View Accessories',
    secondaryHref: '/shop?category=accessories',
    badge: 'New Accessory Edit',
    theme: 'light',
    imagePosition: 'left',
    stats: [
      { value: 'Silk', label: 'Finish' },
      { value: 'Hand', label: 'Crochet' },
      { value: 'Festive', label: 'Ready' },
    ],
  },
];

export function getActiveHomeSections() {
  return MOCK_HOME_SECTIONS.filter(
    (section) => section.isActive && section.showOnHomepage
  ).sort((a, b) => a.order - b.order);
}