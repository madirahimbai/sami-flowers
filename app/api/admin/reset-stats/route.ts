import { NextRequest, NextResponse } from 'next/server';
import { resetOrderCount, resetAllOrderCounts } from '@/lib/db';
import { isAdminFromCookies } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** Zeroes the "units ordered" popularity counter — one product (pass `id`)
 * or every product at once (omit `id`). Admin-only. */
export async function POST(req: NextRequest) {
  if (!(await isAdminFromCookies())) {
    return NextResponse.json({ error: 'not_authorized' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  if (body.id) {
    await resetOrderCount(String(body.id));
  } else {
    await resetAllOrderCounts();
  }
  return NextResponse.json({ ok: true });
}
