import { MetadataRoute } from 'next';
import { listProducts } from '@/lib/db';

const SITE_URL = 'https://www.samiflowers.kz';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await listProducts();
  const productEntries: MetadataRoute.Sitemap = products
    .filter((p) => p.available && (p.category === 'bouquet' || p.category === 'gift'))
    .map((p) => ({
      url: `${SITE_URL}/product/${p.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...productEntries,
  ];
}
