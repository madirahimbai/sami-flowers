import { NextRequest, NextResponse } from 'next/server';
import { listProducts, listProductsFull, upsertProduct, sanitizeVariants } from '@/lib/db';
import { isAdminFromCookies } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// The admin dashboard needs every product's full photo gallery to manage
// them — but this endpoint is also called by the public FavoritesDrawer,
// which only needs enough to render cards. Serving listProductsFull() to
// every visitor meant downloading the entire catalog's base64 photos (many
// MB) just to open the favorites list — branch on auth so the public case
// gets the same lightweight, URL-based images as the rest of the storefront.
export async function GET() {
  const isAdmin = await isAdminFromCookies();
  const products = isAdmin ? await listProductsFull() : await listProducts();
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
    category_tags: Array.isArray(body.category_tags) ? body.category_tags.map(String) : [],
    variants: sanitizeVariants(body.variants),
    tag: body.tag ?? null,
    available: body.available !== false,
  });
  return NextResponse.json({ product });
}
