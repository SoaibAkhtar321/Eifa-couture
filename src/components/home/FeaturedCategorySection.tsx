import Image from 'next/image';
import Link from 'next/link';

export type FeaturedCategorySectionData = {
  id: string;
  eyebrow: string;
  title: string;
  highlightedTitle?: string;
  description: string;
  secondaryDescription?: string;
  imageUrl: string;
  imageAlt: string;
  href: string;
  primaryCta: string;
  secondaryCta?: string;
  secondaryHref?: string;
  badge?: string;
  theme?: 'light' | 'dark';
  imagePosition?: 'left' | 'right';
  isActive?: boolean;
  stats?: {
    value: string;
    label: string;
  }[];
};

type FeaturedCategorySectionProps = {
  section: FeaturedCategorySectionData;
};

export default function FeaturedCategorySection({
  section,
}: FeaturedCategorySectionProps) {
  if (section.isActive === false) return null;

  const isDark = section.theme === 'dark';
  const imageOnRight = section.imagePosition === 'right';

  const sectionClasses = isDark
    ? 'bg-charcoal py-10 text-white md:py-16 lg:py-24'
    : 'bg-ivory py-10 text-charcoal md:py-16 lg:py-24';

  const wrapperClasses = isDark
    ? 'grid overflow-hidden bg-charcoal lg:grid-cols-2'
    : 'grid overflow-hidden border border-beige bg-white lg:grid-cols-2';

  const imageOrderClasses = imageOnRight
    ? 'order-1 lg:order-2'
    : 'order-1 lg:order-1';

  const contentOrderClasses = imageOnRight
    ? 'order-2 lg:order-1'
    : 'order-2 lg:order-2';

  const descriptionClasses = isDark
    ? 'max-w-md font-subheading text-lg italic leading-relaxed text-white/75 md:text-xl'
    : 'max-w-md font-subheading text-lg italic leading-relaxed text-charcoal/70 md:text-xl';

  const secondaryDescriptionClasses = isDark
    ? 'mt-4 max-w-md font-body text-sm leading-relaxed text-white/50 md:mt-5'
    : 'mt-4 max-w-md font-body text-sm leading-relaxed text-charcoal/55 md:mt-5';

  const secondaryButtonClasses = isDark
    ? 'btn-luxury border border-white/20 bg-transparent px-6 py-3 text-center text-[11px] text-white hover:border-gold hover:text-gold md:px-10 md:py-4 md:text-sm'
    : 'btn-luxury border border-beige bg-transparent px-6 py-3 text-center text-[11px] text-charcoal hover:border-gold hover:text-gold md:px-10 md:py-4 md:text-sm';

  const statLabelClasses = isDark
    ? 'mt-1 font-body text-[9px] uppercase tracking-[0.1em] text-white/45 md:text-xs'
    : 'mt-1 font-body text-[9px] uppercase tracking-[0.1em] text-charcoal/45 md:text-xs';

  return (
    <section className={sectionClasses} aria-labelledby={`${section.id}-heading`}>
      <div className="luxury-container">
        <div className={wrapperClasses}>
          <div
            className={`relative aspect-[4/5] overflow-hidden bg-cream sm:aspect-[16/10] lg:aspect-auto lg:min-h-[620px] ${imageOrderClasses}`}
          >
            <Image
              src={section.imageUrl}
              alt={section.imageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-center transition-transform duration-700 hover:scale-105"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/35 via-transparent to-transparent" />

            {section.badge && (
              <div className="absolute left-4 top-4 border border-gold/50 bg-ivory/90 px-4 py-2 backdrop-blur-sm md:left-8 md:top-8">
                <span className="font-body text-[10px] uppercase tracking-[0.24em] text-maroon md:text-xs">
                  {section.badge}
                </span>
              </div>
            )}
          </div>

          <div
            className={`flex items-center px-5 py-9 md:px-10 md:py-12 lg:px-16 xl:px-20 ${contentOrderClasses}`}
          >
            <div className="w-full max-w-xl">
              <div className="mb-4 flex items-center gap-3 md:mb-5">
                <div className="h-px w-8 bg-gold md:w-10" />

                <span className="font-body text-[10px] uppercase tracking-[0.28em] text-gold md:text-xs">
                  {section.eyebrow}
                </span>
              </div>

              <h2
                id={`${section.id}-heading`}
                className={`font-heading text-3xl leading-[1.08] md:text-5xl lg:text-6xl ${
                  isDark ? 'text-white' : 'text-charcoal'
                }`}
              >
                {section.title}
                {section.highlightedTitle && (
                  <>
                    <br />
                    <span className="text-gradient-gold">
                      {section.highlightedTitle}
                    </span>
                  </>
                )}
              </h2>

              <div className="my-5 h-px w-14 bg-gold/40 md:my-7 md:w-16" />

              <p className={descriptionClasses}>{section.description}</p>

              {section.secondaryDescription && (
                <p className={secondaryDescriptionClasses}>
                  {section.secondaryDescription}
                </p>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row md:mt-8">
                <Link
                  href={section.href}
                  className="btn-luxury bg-maroon px-6 py-3 text-center text-[11px] text-white hover:bg-charcoal md:px-10 md:py-4 md:text-sm"
                >
                  {section.primaryCta}
                </Link>

                {section.secondaryCta && section.secondaryHref && (
                  <Link href={section.secondaryHref} className={secondaryButtonClasses}>
                    {section.secondaryCta}
                  </Link>
                )}
              </div>

              {section.stats && section.stats.length > 0 && (
                <div
                  className={`mt-7 grid grid-cols-3 gap-3 border-t pt-5 md:mt-10 md:gap-6 md:pt-7 ${
                    isDark ? 'border-white/10' : 'border-beige'
                  }`}
                >
                  {section.stats.slice(0, 3).map((stat) => (
                    <div key={`${section.id}-${stat.value}-${stat.label}`}>
                      <span className="font-heading text-2xl text-gradient-gold md:text-3xl">
                        {stat.value}
                      </span>

                      <p className={statLabelClasses}>{stat.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}