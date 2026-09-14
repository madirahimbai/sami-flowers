import { NextRequest, NextResponse } from 'next/server';
import { isAdminFromCookies } from '@/lib/auth';
import { compressImage } from '@/lib/image';

export const dynamic = 'force-dynamic';

/** Converts an uploaded photo to a resized/compressed data: URI and hands
 * it straight back — the caller stores it directly on the product row. No
 * separate object storage service: keeps the stack to one thing (Postgres)
 * instead of needing another account/credential for product photos. */
export async function POST(req: NextRequest) {
  if (!(await isAdminFromCookies())) {
    return NextResponse.json({ error: 'not_authorized' }, { status: 401 });
  }
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'no_file' }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: 'too_large' }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const dataUri = await compressImage(buf);
  return NextResponse.json({ url: dataUri });
}
