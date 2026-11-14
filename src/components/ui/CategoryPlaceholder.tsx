/* ============================================
   EIFA COUTURE — Category placeholder art
   ============================================
   Neutral, on-brand stand-in for a category that has neither an
   uploaded image nor any product photo yet: a maroon/gold gradient
   with the category's first letter. Fills its (relatively positioned)
   parent. Server-safe — no client hooks.
   ============================================ */

export function getCategoryInitial(name: string): string {
  const letter = name.trim().charAt(0);
  return letter ? letter.toUpperCase() : '•';
}

interface CategoryPlaceholderProps {
  name: string;
  /** `card` = big tile art, `thumb` = tiny admin thumbnail. */
  size?: 'card' | 'thumb';
}

export default function CategoryPlaceholder({ name, size = 'card' }: CategoryPlaceholderProps) {
  const isCard = size === 'card';

  return (
    <div
      className="absolute inset-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-maroon-dark via-maroon to-maroon-light"
      role="img"
      aria-label={`${name} (no picture yet)`}
    >
      {isCard && (
        <>
          <div className="absolute inset-3 rounded-xl border border-gold/35 md:inset-4" aria-hidden="true" />
          <div
            className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold/10 blur-2xl"
            aria-hidden="true"
          />
        </>
      )}
      <span
        className={`font-heading leading-none text-gold-light/80 ${
          isCard ? 'mb-10 text-7xl md:text-8xl' : 'text-lg'
        }`}
        aria-hidden="true"
      >
        {getCategoryInitial(name)}
      </span>
    </div>
  );
}
