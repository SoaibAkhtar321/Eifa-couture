import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.36'],

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
        hostname: 'uipdsrgzqvwezkghxdih.supabase.co',
      },
    ],
  },
};

export default nextConfig;