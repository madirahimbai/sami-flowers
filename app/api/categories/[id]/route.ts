import { NextRequest, NextResponse } from 'next/server';
import { deleteCategory } from '@/lib/db';
import { isAdminFromCookies } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdminFromCookies())) {
    return NextResponse.json({ error: 'not_authorized' }, { status: 401 });
  }
  await deleteCategory(params.id);
  return NextResponse.json({ ok: true });
}
