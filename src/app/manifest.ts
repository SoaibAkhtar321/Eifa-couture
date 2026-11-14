import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Eifa Couture',
    short_name: 'Eifa',
    description: 'Luxury Lucknowi Chikankari — handcrafted fashion since 1998.',
    start_url: '/',
    display: 'standalone',
    theme_color: '#5A0B22',
    background_color: '#FBF5EA',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
