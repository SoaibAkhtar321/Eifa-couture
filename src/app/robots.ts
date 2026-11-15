import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/constants';

/**
 * Crawling rules.
 *
 * - Admin, API and auth-callback routes are blocked from crawling entirely.
 * - Customer pages (account, checkout, login, wishlist, search, ...) are NOT
 *   listed here on purpose: they carry `noindex` metadata (see the small
 *   `layout.tsx` next to each of those routes). Google can only honour a
 *   `noindex` tag if it is allowed to fetch the page, so blocking them here
 *   as well would defeat it.
 * - Search and AI answer engines are explicitly welcome on the public
 *   catalogue so products can be cited and recommended.
 */
const BLOCKED_PATHS = ['/admin', '/api/', '/auth/'];

const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: BLOCKED_PATHS },
      // A bot-specific group replaces the `*` group, so the blocked paths
      // must be repeated for each one.
      { userAgent: AI_CRAWLERS, allow: '/', disallow: BLOCKED_PATHS },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
