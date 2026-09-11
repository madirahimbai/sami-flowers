import { NextRequest, NextResponse } from 'next/server';
import { capturePayPalOrder } from '@/lib/paypal';
import { notifyTelegram } from '@/lib/telegram';
import { incrementOrderCounts } from '@/lib/db';
import { buildOrderText, OrderItem } from '@/lib/order-text';

export const dynamic = 'force-dynamic';

/** Captures a PayPal order the customer just approved, and — only once
 * PayPal confirms the money actually moved — sends the same order
 * notification the WhatsApp/Telegram flow sends, marked as paid. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const orderId = String(body?.orderId || '');
  if (!orderId || !Array.isArray(body?.items) || body.items.length === 0) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const phoneDigits = String(body.orderPhone || '').replace(/\D/g, '');
  if (!String(body.orderName || '').trim() || phoneDigits.length < 10) {
    return NextResponse.json({ error: 'missing_contact' }, { status: 400 });
  }

  const capture = await capturePayPalOrder(orderId).catch(() => ({ ok: false as const }));
  if (!capture.ok) {
    return NextResponse.json({ error: 'payment_not_completed' }, { status: 402 });
  }

  const items: OrderItem[] = body.items;
  const paymentNote = `Оплата: PayPal ✅ ($${capture.amountUsd?.toFixed(2) ?? '—'})`;
  const text = buildOrderText(body, items, paymentNote);
  const photo = items.find((i) => i.image)?.image ?? null;
  await notifyTelegram(text, photo);
  await incrementOrderCounts(items.map((i) => ({ id: i.id, qty: i.qty })));

  return NextResponse.json({ ok: true, message: text });
}
