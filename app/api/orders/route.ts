import { NextRequest, NextResponse } from 'next/server';
import { notifyTelegram } from '@/lib/telegram';
import { incrementOrderCounts } from '@/lib/db';
import { buildOrderText, OrderItem } from '@/lib/order-text';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const phoneDigits = String(body.orderPhone || '').replace(/\D/g, '');
  if (!String(body.orderName || '').trim() || phoneDigits.length < 10) {
    return NextResponse.json({ error: 'missing_contact' }, { status: 400 });
  }
  const items: OrderItem[] = body.items;

  const text = buildOrderText(body, items);
  const photo = items.find((i) => i.image)?.image ?? null;
  await notifyTelegram(text, photo);
  await incrementOrderCounts(items.map((i) => ({ id: i.id, qty: i.qty })));

  return NextResponse.json({ ok: true, message: text });
}
