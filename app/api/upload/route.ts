import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { isAdminFromCookies } from '@/lib/auth';

export const dynamic = 'force-dynamic';

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
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const key = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const blob = await put(key, file, { access: 'public' });
  return NextResponse.json({ url: blob.url });
}
