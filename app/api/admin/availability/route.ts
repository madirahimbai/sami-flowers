import { NextRequest, NextResponse } from 'next/server';
import { setProductAvailability } from '@/lib/db';
import { isAdminFromCookies } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** Sets one product's in-stock flag. Admin-only. Body: { id, available }. */
export async function POST(req: NextRequest) {
  if (!(await isAdminFromCookies())) {
    return NextResponse.json({ error: 'not_authorized' }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body.id !== 'string' || typeof body.available !== 'boolean') {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const found = await setProductAvailability(body.id, body.available);
  if (!found) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
