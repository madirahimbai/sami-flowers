import { NextRequest, NextResponse } from 'next/server';
import { getProduct } from '@/lib/db';

export const dynamic = 'force-dynamic';

function decodeDataUri(uri: string): { buf: Buffer; mime: string } | null {
  const m = uri.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!m) return null;
  return { buf: Buffer.from(m[2], 'base64'), mime: m[1] };
}

/** Serves a product's cover photo as a real, fetchable image URL (with a
 * proper Content-Type and cache headers) — needed because the photo itself
 * is stored as a data: URI in Postgres, which social-share crawlers and
 * Google's structured-data parser can't fetch as an og:image/JSON-LD image
 * URL the way they can a normal file. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  if (!product?.image) return new NextResponse(null, { status: 404 });
  const decoded = decodeDataUri(product.image);
  if (!decoded) return new NextResponse(null, { status: 404 });
  return new NextResponse(decoded.buf, {
    headers: {
      'Content-Type': decoded.mime,
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  });
}
