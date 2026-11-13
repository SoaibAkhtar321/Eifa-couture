import type { MetadataRoute } from 'next';

const SITE_URL = 'https://eifacouture.com';

/**
 * Keep private, transactional and admin routes out of search results.
 * Public catalogue pages stay crawlable.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api/',
          '/account',
          '/checkout',
          '/order-confirmation/',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/wishlist',
          '/search',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
