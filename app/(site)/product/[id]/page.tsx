import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProduct, listProducts } from '@/lib/db';
import ProductPageClient from '@/components/ProductPageClient';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://www.samiflowers.kz';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const product = await getProduct(params.id);
  if (!product || !product.available) return {};

  const description =
    product.description?.trim().slice(0, 160) ||
    `${product.name} с доставкой по Павлодару за 60 минут. Заказ в WhatsApp, самовывоз с Торайгырова и Амангельды. Sami Flowers.`;
  const imageUrl = product.image ? `${SITE_URL}/api/products/${product.id}/image` : undefined;

  return {
    title: product.name,
    description,
    alternates: { canonical: `/product/${product.id}` },
    openGraph: {
      title: product.name,
      description,
      url: `${SITE_URL}/product/${product.id}`,
      images: imageUrl ? [{ url: imageUrl, width: 900, height: 900 }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  if (!product || !product.available) notFound();

  const all = await listProducts('bouquet');
  const related = all.filter((p) => p.id !== product.id).sort(() => Math.random() - 0.5).slice(0, 4);
  const addons = (await listProducts('addon')).filter((p) => p.available);
  const included = (await listProducts('included')).filter((p) => p.available);

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `${product.name} — букет с доставкой по Павлодару.`,
    image: product.image ? `${SITE_URL}/api/products/${product.id}/image` : undefined,
    sku: product.id,
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/product/${product.id}`,
      priceCurrency: 'KZT',
      price: product.price,
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'Sami Flowers' },
    },
  };

  // Product name/description can come from admin or the Telegram add-product
  // bot — escape "<" so a value containing "</script>" can't break out of
  // this script tag and inject markup into the page.
  const productSchemaJson = JSON.stringify(productSchema).replace(/</g, '\\u003c');

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: productSchemaJson }}
      />
      <ProductPageClient product={product} related={related} addons={addons} included={included} />
    </>
  );
}
