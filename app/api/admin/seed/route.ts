import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { upsertProduct, countProducts } from '@/lib/db';
import seedProducts from '@/data/seed-products.json';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type SeedProduct = {
  id: string;
  name: string;
  number: number | null;
  price: number;
  desc: string;
  image: string | null; // path under /public, e.g. "/seed-images/buket-12.jpg"
  category: 'bouquet' | 'gift';
  tag: string | null;
  available: boolean;
};

/**
 * One-time setup: populates the database with the shop's starting catalog
 * (real bouquets from the spreadsheet import, plus the gift items),
 * reading each photo straight off disk (public/seed-images, bundled with
 * the deployment) and storing it as a data: URI on the row. Deliberately
 * NOT an HTTP self-fetch to the app's own public URL — several hosts
 * (Railway included) don't route a container's outbound request back to
 * its own public domain, so that pattern fails silently in production
 * even though the same path works fine when a browser requests it.
 * Protected by SEED_SECRET — call it once after deploying, then forget
 * about it (re-running is safe: it just overwrites the same rows).
 *
 * Usage: POST /api/admin/seed  with header  x-seed-secret: <SEED_SECRET>
 */
export async function POST(req: NextRequest) {
  const provided = req.headers.get('x-seed-secret');
  const expected = process.env.SEED_SECRET;
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: 'not_authorized' }, { status: 401 });
  }

  const products = seedProducts as SeedProduct[];
  let created = 0;
  const errors: string[] = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    let imageDataUri: string | null = null;
    if (p.image) {
      try {
        const filePath = path.join(process.cwd(), 'public', p.image.replace(/^\//, ''));
        const buf = await readFile(filePath);
        imageDataUri = `data:image/jpeg;base64,${buf.toString('base64')}`;
      } catch (e: any) {
        errors.push(`${p.id}: ${e.message || e}`);
      }
    }
    try {
      await upsertProduct({
        id: p.id,
        name: p.name,
        number: p.number,
        price: p.price,
        description: p.desc,
        image: imageDataUri,
        category: p.category,
        tag: p.tag,
        available: p.available,
        sort_order: i,
      });
      created++;
    } catch (e: any) {
      errors.push(`${p.id}: ${e.message || e}`);
    }
  }

  const total = await countProducts();
  return NextResponse.json({ ok: true, created, totalInDb: total, errors });
}
