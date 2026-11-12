import Image from 'next/image';
import Link from 'next/link';

type Card = {
  id: string;
  index: string;
  eyebrow: string;
  title: string;
  tagline: string;
  text: string;
  image: string;
  imageAlt: string;
  href: string;
  cta: string;
  chips: string[];
  panel: string; // background of the text panel
  ink: 'light' | 'dark';
};

const CARDS: Card[] = [
  {
    id: 'women',
    index: '01',
    eyebrow: 'For Her',
    title: "Women's Collection",
    tagline: 'A canvas of Lucknowi artistry',
    text: 'Sarees, anarkalis, kurta sets and bridal ensembles — every motif hand-embroidered by our master karigars.',
    image: '/images/collections/women.png',
    imageAlt: "Model in a maroon hand-embroidered Chikankari anarkali",
    href: '/shop?audience=women',
    cta: "Explore Women's Edit",
    chips: ['Sarees', 'Kurta Sets', 'Anarkalis', 'Bridal'],
    panel: 'bg-[#6B1A2E]',
    ink: 'light',
  },
  {
    id: 'men',
    index: '02',
    eyebrow: 'For Him',
    title: "Men's Collection",
    tagline: 'Understated, timeless, refined',
    text: 'Chikankari kurtas in cotton lawn, pure silk and chanderi — crisp whites for summer, rich tones for festive days.',
    image: '/images/collections/men.png',
    imageAlt: 'Model in an ivory Chikankari kurta',
    href: '/shop?audience=men',
    cta: "Explore Men's Edit",
    chips: ['Kurtas', 'Kurta Sets', 'Festive', 'Everyday'],
    panel: 'bg-[#2B2B2B]',
    ink: 'light',
  },
  {
    id: 'accessories',
    index: '03',
    eyebrow: 'Silk Accessories',
    title: 'Bags & Accessories',
    tagline: 'The finishing touch',
    text: 'Silk potli bags, crochet clutches, embroidered dupattas and stoles — made to complete every Chikankari look.',
    image: '/images/categories/dupattas.png',
    imageAlt: 'Hand-embroidered silk dupattas and accessories',
    href: '/shop?category=bags-accessories',
    cta: 'Explore Accessories',
    chips: ['Silk Bags', 'Potlis', 'Dupattas', 'Stoles'],
    panel: 'bg-[#E9D9BD]',
    ink: 'dark',
  },
];

/**
 * Editorial collection cards that stack on scroll: each card is
 * `position: sticky`, so the next one slides up and overlaps it.
 * Pure CSS — no scroll listeners.
 */
export default function StackedCollections() {
  return (
    <section className="bg-ivory py-12 md:py-20" aria-labelledby="collections-heading">
      <div className="luxury-container">
        <div className="mb-8 flex items-end justify-between gap-6 md:mb-12">
          <div>
            <span className="block text-[10px] uppercase tracking-[0.3em] text-gold-dark md:text-xs">The Collections</span>
            <h2 id="collections-heading" className="mt-2 font-heading text-3xl text-charcoal md:text-5xl">
              Curated for every occasion
            </h2>
          </div>
          <nav aria-label="Collections" className="hidden flex-col gap-2 text-xs uppercase tracking-[0.2em] text-ink-soft md:flex">
            {CARDS.map((card) => (
              <a key={card.id} href={`#collection-${card.id}`} className="transition-colors hover:text-maroon">
                <span className="mr-3 text-gold-dark">{card.index}</span>
                {card.eyebrow}
              </a>
            ))}
          </nav>
        </div>

        <div className="relative">
          {CARDS.map((card, i) => {
            const light = card.ink === 'light';
            return (
              <article
                key={card.id}
                id={`collection-${card.id}`}
                className="mb-5 scroll-mt-28 md:sticky md:mb-10"
                style={{ top: `calc(${7.5 + i * 1.25}rem)` }}
              >
                <Link
                  href={card.href}
                  className="group grid overflow-hidden rounded-2xl shadow-[0_-12px_40px_rgba(43,43,43,0.12)] md:min-h-[520px] md:grid-cols-[1.05fr_1fr]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-beige md:aspect-auto">
                    <Image
                      src={card.image}
                      alt={card.imageAlt}
                      fill
                      sizes="(max-width: 768px) 100vw, 55vw"
                      className="object-cover object-[50%_20%] transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
                    />
                    <span className="absolute bottom-3 right-4 font-heading text-6xl text-white/80 md:text-8xl" aria-hidden="true">
                      {card.index}
                    </span>
                  </div>

                  <div className={`${card.panel} flex flex-col justify-center px-6 py-8 md:px-12 lg:px-16 ${light ? 'text-white' : 'text-charcoal'}`}>
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.28em] md:text-xs">
                      <span className={light ? 'text-gold-light' : 'text-maroon'}>{card.eyebrow}</span>
                      <span className={light ? 'text-white/70' : 'text-ink-muted'}>
                        {card.index} / {String(CARDS.length).padStart(2, '0')}
                      </span>
                    </div>

                    <h3 className={`mt-5 font-heading text-3xl leading-tight md:text-5xl ${light ? 'text-white' : 'text-charcoal'}`}>
                      {card.title}
                    </h3>
                    <p className={`mt-2 font-subheading text-xl italic md:text-2xl ${light ? 'text-gold-light' : 'text-maroon'}`}>
                      {card.tagline}
                    </p>
                    <p className={`mt-4 max-w-md text-sm leading-7 md:text-base ${light ? 'text-white/85' : 'text-ink-soft'}`}>
                      {card.text}
                    </p>

                    <ul className="mt-6 flex flex-wrap gap-2">
                      {card.chips.map((chip) => (
                        <li
                          key={chip}
                          className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.16em] md:text-[11px] ${
                            light ? 'border-white/30 text-white/90' : 'border-charcoal/25 text-ink-soft'
                          }`}
                        >
                          {chip}
                        </li>
                      ))}
                    </ul>

                    <span
                      className={`mt-8 inline-flex w-fit items-center gap-3 border-b pb-1 text-[11px] font-medium uppercase tracking-[0.2em] transition-[gap] group-hover:gap-5 md:text-xs ${
                        light ? 'border-gold-light text-gold-light' : 'border-maroon text-maroon'
                      }`}
                    >
                      {card.cta} <span aria-hidden="true">→</span>
                    </span>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
