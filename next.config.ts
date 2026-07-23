import type { NextConfig } from 'next';

const supabaseHostname = 'uipdsrgzqvwezkghxdih.supabase.co';

// CSP intentionally lists only origins this app actually talks to
// today (Supabase + the demo image CDNs already in `images.remotePatterns`
// below). Extend this list, not `unsafe`-anything, if a new trusted
// origin is added later (e.g. a payment provider once implemented).
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  `img-src 'self' data: blob: https://picsum.photos https://images.unsplash.com https://images.pexels.com https://cdn.shopify.com https://${supabaseHostname}`,
  `connect-src 'self' https://${supabaseHostname} wss://${supabaseHostname}`,
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.36'],

  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      },
      {
        // Supabase Storage — product-images bucket (see supabase/storage/STORAGE_PLAN.md)
        protocol: 'https',
        hostname: supabaseHostname,
      },
    ],
  },
};

export default nextConfig;