import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter, Playfair_Display } from 'next/font/google';
import './globals.css';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/ui/CartDrawer';
import AuthProvider from '@/providers/AuthProvider';
import CartSyncProvider from '@/providers/CartSyncProvider';
import WishlistSyncProvider from '@/providers/WishlistSyncProvider';

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-heading',
  display: 'swap',
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-subheading',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Eifa Couture | Luxury Lucknowi Chikankari',
    template: '%s | Eifa Couture',
  },
  description:
    'Discover premium handcrafted Lucknowi Chikankari fashion at Eifa Couture. Since 1998, we have been weaving heritage into every thread.',
  keywords: [
    'Lucknowi Chikankari',
    'luxury Indian fashion',
    'handcrafted kurtas',
    'Chikankari anarkali',
    'premium ethnic wear',
    'Indian designer wear',
    'Eifa Couture',
    'Lucknow embroidery',
    'bridal chikankari',
    'chikan sarees',
  ],
  authors: [{ name: 'Eifa Couture' }],
  creator: 'Eifa Couture',
  publisher: 'Eifa Couture',
  metadataBase: new URL('https://eifacouture.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://eifacouture.com',
    siteName: 'Eifa Couture',
    title: 'Eifa Couture | Luxury Lucknowi Chikankari',
    description:
      'Discover premium handcrafted Lucknowi Chikankari fashion. Exquisite kurtas, anarkalis, sarees, and bridal collections crafted by master artisans since 1998.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Eifa Couture — Luxury Lucknowi Chikankari Fashion',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Eifa Couture | Luxury Lucknowi Chikankari',
    description:
      'Premium handcrafted Lucknowi Chikankari fashion — kurtas, anarkalis, sarees and bridal collections since 1998.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

// Required for `env(safe-area-inset-*)` to resolve to a real value on
// notched/home-indicator iOS devices — without `viewport-fit: cover`,
// Safari never expands the viewport under the safe areas, so any CSS
// using env(safe-area-inset-bottom) (e.g. MobileStickyActionBar) would
// silently receive 0 and the bottom padding it's meant to add would
// have no effect.
export const viewport: Viewport = {
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfairDisplay.variable} ${cormorantGaramond.variable} ${inter.variable} antialiased`}
    >
      <body className="min-h-screen bg-ivory font-body text-charcoal selection:bg-maroon selection:text-white">
       <AuthProvider>
  <CartSyncProvider>
    <WishlistSyncProvider>
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <Header />

      <div className="flex-1 w-full relative z-10">
        {children}
      </div>

      <Footer />
      <CartDrawer />
    </div>
    </WishlistSyncProvider>
  </CartSyncProvider>
</AuthProvider>
      </body>
    </html>
  );
}