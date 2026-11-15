import type { Metadata, Viewport } from 'next';
// Self-hosted fonts (bundled at build time, no Google Fonts fetch —
// builds work offline/in CI and no third-party font request at runtime).
import '@fontsource-variable/playfair-display/wght.css';
import '@fontsource-variable/playfair-display/wght-italic.css';
import '@fontsource-variable/cormorant-garamond/wght.css';
import '@fontsource-variable/cormorant-garamond/wght-italic.css';
import '@fontsource-variable/inter/wght.css';
import './globals.css';

import AuthProvider from '@/providers/AuthProvider';
import { CONTACT_INFO, LEGAL_INFO, SITE_URL, SOCIAL_LINKS } from '@/lib/constants';

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
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
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
  // Favicon / app icons come from the file conventions in src/app:
  // favicon.ico, icon.png, apple-icon.png (+ manifest.ts).
};

// Brand structured data for search results (Organization + WebSite).
// Social profiles (`sameAs`) and the contact email come from src/lib/constants.ts.
const brandJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'Eifa Couture',
      ...(LEGAL_INFO.legalName ? { legalName: LEGAL_INFO.legalName } : {}),
      ...(LEGAL_INFO.gstin ? { taxID: LEGAL_INFO.gstin } : {}),
      url: SITE_URL,
      logo: `${SITE_URL}/images/eifa-logo-header.png`,
      description:
        'Premium handcrafted Lucknowi Chikankari fashion — kurtas, anarkalis, sarees and bridal collections.',
      foundingDate: '1998',
      email: CONTACT_INFO.email,
      telephone: CONTACT_INFO.phoneE164,
      address: {
        '@type': 'PostalAddress',
        streetAddress: CONTACT_INFO.address.line1,
        addressLocality: CONTACT_INFO.address.city,
        addressRegion: CONTACT_INFO.address.state,
        postalCode: CONTACT_INFO.address.pincode,
        addressCountry: 'IN',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: CONTACT_INFO.email,
        telephone: CONTACT_INFO.phoneE164,
        areaServed: 'IN',
        availableLanguage: ['en', 'hi'],
      },
      sameAs: SOCIAL_LINKS.map((link) => link.href),
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: 'Eifa Couture',
      url: SITE_URL,
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
  ],
};

// Required for `env(safe-area-inset-*)` to resolve to a real value on
// notched/home-indicator iOS devices — without `viewport-fit: cover`,
// Safari never expands the viewport under the safe areas, so any CSS
// using env(safe-area-inset-bottom) (e.g. MobileStickyActionBar) would
// silently receive 0 and the bottom padding it's meant to add would
// have no effect.
export const viewport: Viewport = {
  viewportFit: 'cover',
  themeColor: '#FBF5EA',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="antialiased"
    >
      <body className="min-h-screen bg-ivory font-body text-charcoal selection:bg-maroon selection:text-white">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(brandJsonLd).replace(/</g, '\\u003c') }}
        />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}