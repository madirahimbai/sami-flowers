import { NextRequest, NextResponse } from 'next/server';
import { listCategories, upsertCategory } from '@/lib/db';
import { isAdminFromCookies } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Public — the storefront catalog needs this list to render its tabs, same
// as /api/products is public for the catalog grid itself.
export async function GET() {
  const categories = await listCategories();
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminFromCookies())) {
    return NextResponse.json({ error: 'not_authorized' }, { status: 401 });
  }
  const body = await req.json();
  const id = String(body.id || '').trim();
  const label = String(body.label || '').trim();
  if (!id || !label) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const category = await upsertCategory({ id, label, sort_order: Number(body.sort_order) || 0 });
  return NextResponse.json({ category });
}
