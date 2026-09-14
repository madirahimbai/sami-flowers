import { MetadataRoute } from 'next';
import { listProducts } from '@/lib/db';

export const dynamic = 'force-dynamic';

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

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/roses`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/delivery`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/contacts`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  return [...staticEntries, ...productEntries];
}
