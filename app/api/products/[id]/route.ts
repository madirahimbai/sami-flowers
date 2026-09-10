import { NextRequest, NextResponse } from 'next/server';
import { getProduct, upsertProduct, deleteProduct } from '@/lib/db';
import { isAdminFromCookies } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  if (!product) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdminFromCookies())) {
    return NextResponse.json({ error: 'not_authorized' }, { status: 401 });
  }
  const existing = await getProduct(params.id);
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const body = await req.json();
  const product = await upsertProduct({
    id: params.id,
    name: body.name ?? existing.name,
    number: body.number !== undefined ? body.number : existing.number,
    price: body.price !== undefined ? Math.round(body.price) : existing.price,
    description: body.description !== undefined ? body.description : existing.description,
    image: body.image !== undefined ? body.image : existing.image,
    images: Array.isArray(body.images) ? body.images.slice(0, 5).map(String) : existing.images,
    category: body.category ?? existing.category,
    tag: body.tag !== undefined ? body.tag : existing.tag,
    available: body.available !== undefined ? body.available : existing.available,
    sort_order: existing.sort_order,
  });
  return NextResponse.json({ product });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdminFromCookies())) {
    return NextResponse.json({ error: 'not_authorized' }, { status: 401 });
  }
  await deleteProduct(params.id);
  return NextResponse.json({ ok: true });
}
