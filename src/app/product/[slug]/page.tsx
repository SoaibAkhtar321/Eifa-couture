import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/ui/CartDrawer';
import ProductDetailsClient from '@/components/product/ProductDetailsClient';
import { MOCK_PRODUCTS } from '@/lib/mock-data';

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  return MOCK_PRODUCTS.filter((product) => product.isActive).map((product) => ({
    slug: product.slug,
  }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = MOCK_PRODUCTS.find(
    (item) => item.slug === slug && item.isActive
  );

  if (!product) {
    return {
      title: 'Product Not Found | Eifa Couture',
    };
  }

  return {
    title: product.seo.title,
    description: product.seo.description,
    keywords: product.seo.keywords,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const product = MOCK_PRODUCTS.find(
    (item) => item.slug === slug && item.isActive
  );

  if (!product) {
    notFound();
  }

  const relatedProducts = MOCK_PRODUCTS.filter(
    (item) =>
      item.isActive &&
      item.id !== product.id &&
      item.category === product.category
  ).slice(0, 4);

  const fallbackRelatedProducts = MOCK_PRODUCTS.filter(
    (item) => item.isActive && item.id !== product.id
  ).slice(0, 4);

  return (
    <>
      <Header />

      <main>
        <ProductDetailsClient
          product={product}
          relatedProducts={
            relatedProducts.length > 0 ? relatedProducts : fallbackRelatedProducts
          }
        />
      </main>

      <Footer />
      <CartDrawer />
    </>
  );
}