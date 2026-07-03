import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import ProductDetailsClient from '@/components/product/ProductDetailsClient';

import { MOCK_PRODUCTS } from '@/lib/mock-data';

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const RELATED_PRODUCTS_LIMIT = 4;

function getActiveProductBySlug(slug: string) {
  return MOCK_PRODUCTS.find((product) => product.slug === slug && product.isActive);
}

function getRelatedProducts(productId: string, category: string) {
  const categoryRelatedProducts = MOCK_PRODUCTS.filter(
    (product) =>
      product.isActive &&
      product.id !== productId &&
      product.category === category
  ).slice(0, RELATED_PRODUCTS_LIMIT);

  if (categoryRelatedProducts.length > 0) {
    return categoryRelatedProducts;
  }

  return MOCK_PRODUCTS.filter(
    (product) => product.isActive && product.id !== productId
  ).slice(0, RELATED_PRODUCTS_LIMIT);
}

export async function generateStaticParams() {
  return MOCK_PRODUCTS.filter((product) => product.isActive).map((product) => ({
    slug: product.slug,
  }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getActiveProductBySlug(slug);

  if (!product) {
    return {
      title: 'Product Not Found | Eifa Couture',
      description: 'The requested product could not be found at Eifa Couture.',
    };
  }

  return {
    title: product.seo.title,
    description: product.seo.description,
    keywords: product.seo.keywords,
    openGraph: {
      title: product.seo.title,
      description: product.seo.description,
      type: 'website',
      images: product.images?.[0]
        ? [
            {
              url: product.images[0],
              alt: product.name,
            },
          ]
        : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getActiveProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = getRelatedProducts(product.id, product.category);

  return (
    <>

      <main
        id="product-main-content"
        className="w-full scroll-mt-[72px] sm:scroll-mt-[78px] lg:scroll-mt-[84px]"
      >
        {/* key={slug} forces a full unmount/remount on every product change,
            clearing leftover gallery/review/carousel state from the previous product */}
        <ProductDetailsClient
          key={slug}
          product={product}
          relatedProducts={relatedProducts}
        />
      </main>

    </>
  );
}