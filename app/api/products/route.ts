import { NextRequest, NextResponse } from 'next/server';
import { listProductsFull, upsertProduct } from '@/lib/db';
import { isAdminFromCookies } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Only the admin dashboard calls this — it needs every product's full
// photo gallery to manage them, unlike the lighter storefront queries.
export async function GET() {
  const products = await listProductsFull();
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminFromCookies())) {
    return NextResponse.json({ error: 'not_authorized' }, { status: 401 });
  }
  const body = await req.json();
  if (!body.id || !body.name || typeof body.price !== 'number') {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const product = await upsertProduct({
    id: String(body.id),
    name: String(body.name),
    number: body.number ?? null,
    price: Math.round(body.price),
    description: body.description ?? null,
    image: body.image ?? null,
    images: Array.isArray(body.images) ? body.images.slice(0, 5).map(String) : [],
    category:
      body.category === 'gift' || body.category === 'addon' || body.category === 'included'
        ? body.category
        : 'bouquet',
    tag: body.tag ?? null,
    available: body.available !== false,
  });
  return NextResponse.json({ product });
}
