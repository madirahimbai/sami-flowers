import { NextRequest, NextResponse } from 'next/server';
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
 * reading each photo from /public/seed-images and storing it as a data:
 * URI directly on the row. Protected by SEED_SECRET so it can't be
 * triggered by a stranger — call it once after deploying, then forget
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

  const origin = req.nextUrl.origin;
  const products = seedProducts as SeedProduct[];
  let created = 0;
  const errors: string[] = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    let imageDataUri: string | null = null;
    if (p.image) {
      try {
        const res = await fetch(origin + p.image);
        if (!res.ok) throw new Error(`fetch ${p.image} failed: ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
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
