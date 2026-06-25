import type { Metadata } from "next";
import {
  Playfair_Display,
  Cormorant_Garamond,
  Inter,
} from "next/font/google";
import "./globals.css";

/* ── Google Fonts Configuration ── */
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-subheading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

/* ── SEO Metadata ── */
export const metadata: Metadata = {
  title: {
    default: "Eifa Couture | Luxury Lucknowi Chikankari",
    template: "%s | Eifa Couture",
  },
  description:
    "Discover premium handcrafted Lucknowi Chikankari fashion at Eifa Couture. Since 1998, we have been weaving heritage into every thread — offering exquisite kurtas, anarkalis, sarees, and bridal collections crafted by master artisans of Lucknow.",
  keywords: [
    "Lucknowi Chikankari",
    "luxury Indian fashion",
    "handcrafted kurtas",
    "Chikankari anarkali",
    "premium ethnic wear",
    "Indian designer wear",
    "Eifa Couture",
    "Lucknow embroidery",
    "bridal chikankari",
    "chikan sarees",
  ],
  authors: [{ name: "Eifa Couture" }],
  creator: "Eifa Couture",
  publisher: "Eifa Couture",
  metadataBase: new URL("https://eifacouture.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://eifacouture.com",
    siteName: "Eifa Couture",
    title: "Eifa Couture | Luxury Lucknowi Chikankari",
    description:
      "Discover premium handcrafted Lucknowi Chikankari fashion. Exquisite kurtas, anarkalis, sarees, and bridal collections crafted by master artisans since 1998.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Eifa Couture — Luxury Lucknowi Chikankari Fashion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Eifa Couture | Luxury Lucknowi Chikankari",
    description:
      "Premium handcrafted Lucknowi Chikankari fashion — kurtas, anarkalis, sarees & bridal collections since 1998.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

/* ── Root Layout ── */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfairDisplay.variable} ${cormorantGaramond.variable} ${inter.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-body antialiased">
        {children}
      </body>
    </html>
  );
}
