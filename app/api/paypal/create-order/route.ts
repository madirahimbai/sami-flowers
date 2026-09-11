import { NextRequest, NextResponse } from 'next/server';
import { createPayPalOrder } from '@/lib/paypal';

export const dynamic = 'force-dynamic';

/** Creates a PayPal order for the cart total (converted from тенге to USD
 * — PayPal doesn't support KZT). Called right before the PayPal buttons
 * render; the returned orderId is what the PayPal SDK then shows the
 * approval popup for. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const totalKzt = Number(body?.totalKzt);
  if (!totalKzt || totalKzt <= 0) {
    return NextResponse.json({ error: 'invalid_total' }, { status: 400 });
  }
  try {
    const { orderId, amountUsd } = await createPayPalOrder(totalKzt);
    return NextResponse.json({ orderId, amountUsd });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'paypal_error' }, { status: 500 });
  }
}
