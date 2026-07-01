/* ============================================
   EIFA COUTURE — Recent Search History
   Lightweight localStorage-backed recent search
   list, shared between HeaderSearch and the
   /search results page.
   ============================================ */

const RECENT_SEARCHES_KEY = 'eifa-couture-recent-searches';
const MAX_RECENT_SEARCHES = 6;

function isBrowser() {
  return typeof window !== 'undefined';
}

/**
 * Read recent searches from localStorage, most recent first.
 * Safe to call on the server (returns []) or if storage is unavailable.
 */
export function getRecentSearches(): string[] {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((term): term is string => typeof term === 'string')
      .slice(0, MAX_RECENT_SEARCHES);
  } catch {
    return [];
  }
}

/**
 * Save a new search term, de-duplicated and most-recent-first,
 * capped at MAX_RECENT_SEARCHES entries.
 */
export function addRecentSearch(term: string): string[] {
  const trimmed = term.trim();
  if (!trimmed || !isBrowser()) return getRecentSearches();

  const existing = getRecentSearches().filter(
    (savedTerm) => savedTerm.toLowerCase() !== trimmed.toLowerCase()
  );

  const updated = [trimmed, ...existing].slice(0, MAX_RECENT_SEARCHES);

  try {
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Storage unavailable (private browsing, quota, etc.) — fail silently.
  }

  return updated;
}

/** Remove a single recent search term. */
export function removeRecentSearch(term: string): string[] {
  if (!isBrowser()) return [];

  const updated = getRecentSearches().filter(
    (savedTerm) => savedTerm.toLowerCase() !== term.toLowerCase()
  );

  try {
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors.
  }

  return updated;
}

/** Clear all recent searches. */
export function clearRecentSearches(): void {
  if (!isBrowser()) return;

  try {
    window.localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Ignore storage errors.
  }
}