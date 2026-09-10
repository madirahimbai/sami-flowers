import { notFound } from 'next/navigation';
import { getProduct, listProducts } from '@/lib/db';
import ProductPageClient from '@/components/ProductPageClient';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  if (!product || !product.available) notFound();

  const all = await listProducts('bouquet');
  const related = all.filter((p) => p.id !== product.id).sort(() => Math.random() - 0.5).slice(0, 4);
  const addons = (await listProducts('addon')).filter((p) => p.available);

  return <ProductPageClient product={product} related={related} addons={addons} />;
}
