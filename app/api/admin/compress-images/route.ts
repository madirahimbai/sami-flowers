import { NextRequest, NextResponse } from 'next/server';
import { listProductsFull, updateProductImages } from '@/lib/db';
import { compressImage } from '@/lib/image';

export const dynamic = 'force-dynamic';

function decodeDataUri(uri: string): Buffer | null {
  const m = uri.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/);
  return m ? Buffer.from(m[1], 'base64') : null;
}

/**
 * One-time cleanup: re-compresses every product's already-stored photos.
 * Before compressImage() existed, uploads (admin panel and the products
 * Telegram bot) were stored at original size — some several MB each —
 * which had bloated the homepage to tens of MB. Safe to re-run: an
 * already-compressed photo just gets compressed again with no visible
 * change.
 *
 * Usage: POST /api/admin/compress-images  with header  x-setup-secret: <TELEGRAM_WEBHOOK_SECRET>
 */
export async function POST(req: NextRequest) {
  const provided = req.headers.get('x-setup-secret');
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: 'not_authorized' }, { status: 401 });
  }

  const products = await listProductsFull();
  let processed = 0;
  let beforeTotal = 0;
  let afterTotal = 0;
  const errors: string[] = [];

  for (const p of products) {
    if (!p.image && p.images.length === 0) continue;
    try {
      const beforeLen = (p.image?.length ?? 0) + p.images.reduce((s, i) => s + i.length, 0);

      let newImage: string | null = p.image;
      if (p.image) {
        const buf = decodeDataUri(p.image);
        if (buf) newImage = await compressImage(buf);
      }

      const newImages: string[] = [];
      for (const img of p.images) {
        const buf = decodeDataUri(img);
        newImages.push(buf ? await compressImage(buf) : img);
      }

      await updateProductImages(p.id, newImage, newImages);

      const afterLen = (newImage?.length ?? 0) + newImages.reduce((s, i) => s + i.length, 0);
      beforeTotal += beforeLen;
      afterTotal += afterLen;
      processed++;
    } catch (e: any) {
      errors.push(`${p.id}: ${e.message || e}`);
    }
  }

  return NextResponse.json({
    ok: true,
    processed,
    beforeMB: Math.round((beforeTotal / 1024 / 1024) * 10) / 10,
    afterMB: Math.round((afterTotal / 1024 / 1024) * 10) / 10,
    errors,
  });
}
