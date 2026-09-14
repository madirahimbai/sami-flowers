import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProduct, listProducts } from '@/lib/db';
import { productDisplayTitle } from '@/lib/types';
import { isRoseProduct } from '@/lib/roses';
import ProductPageClient from '@/components/ProductPageClient';
import Breadcrumbs, { breadcrumbSchema } from '@/components/Breadcrumbs';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://www.samiflowers.kz';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const product = await getProduct(params.id);
  if (!product || !product.available) return {};

  const displayTitle = productDisplayTitle(product);
  const description =
    product.description?.trim().slice(0, 160) ||
    `${product.name} с доставкой по Павлодару. Заказ в WhatsApp, самовывоз с Торайгырова и Амангельды. Sami Flowers.`;
  const imageUrl = product.image ? `${SITE_URL}/api/products/${product.id}/image` : undefined;

  return {
    title: displayTitle,
    description,
    alternates: { canonical: `/product/${product.id}` },
    openGraph: {
      title: displayTitle,
      description,
      url: `${SITE_URL}/product/${product.id}`,
      siteName: 'Sami Flowers',
      locale: 'ru_RU',
      type: 'website',
      images: imageUrl ? [{ url: imageUrl, width: 900, height: 900 }] : ['/opengraph-image'],
    },
    twitter: {
      card: 'summary_large_image',
      title: displayTitle,
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
    name: productDisplayTitle(product),
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

  const isRose = isRoseProduct(product);
  const crumbs = isRose
    ? [{ label: 'Главная', href: '/' }, { label: 'Розы', href: '/roses' }, { label: product.name }]
    : [{ label: 'Главная', href: '/' }, { label: 'Каталог', href: '/#catalog' }, { label: product.name }];

  // Product name/description can come from admin or the Telegram add-product
  // bot — escape "<" so a value containing "</script>" can't break out of
  // this script tag and inject markup into the page.
  const productSchemaJson = JSON.stringify(productSchema).replace(/</g, '\\u003c');
  const breadcrumbSchemaJson = JSON.stringify(breadcrumbSchema(crumbs)).replace(/</g, '\\u003c');

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: productSchemaJson }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: breadcrumbSchemaJson }}
      />
      <div className="wrap">
        <Breadcrumbs items={crumbs} />
      </div>
      <ProductPageClient product={product} related={related} addons={addons} included={included} />
    </>
  );
}
