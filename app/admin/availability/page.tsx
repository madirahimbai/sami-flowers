import type { Metadata } from 'next';
import { listProducts } from '@/lib/db';
import AvailabilityClient from '@/components/AvailabilityClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Наличие товаров',
  robots: { index: false, follow: false },
};

export default async function AvailabilityPage() {
  const products = await listProducts();
  return <AvailabilityClient products={products} />;
}
