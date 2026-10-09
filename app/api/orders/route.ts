import { NextRequest, NextResponse } from 'next/server';
import { notifyTelegram } from '@/lib/telegram';
import { incrementOrderCounts, saveOrder, markOrderNotified } from '@/lib/db';
import { buildOrderText, OrderItem } from '@/lib/order-text';
import { retryUnnotifiedOrders } from '@/lib/orders';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const items: OrderItem[] = body.items;

  const text = buildOrderText(body, items);
  const photo = items.find((i) => i.image)?.image ?? null;
  const total =
    items.reduce((s, i) => s + i.price * i.qty, 0) + (body.deliveryMethod === 'courier' ? Number(body.deliveryFee) || 0 : 0);
  const clientId = typeof body.clientId === 'string' && body.clientId ? body.clientId.slice(0, 64) : null;

  // Saved first: whatever happens to Telegram below, the order exists in
  // the database and shows up in /admin/orders.
  let orderId: number | null = null;
  let duplicate = false;
  try {
    const saved = await saveOrder({
      clientId,
      text,
      photo: photo && !photo.startsWith('data:') ? photo : null,
      total: Math.round(total),
    });
    orderId = saved.id;
    duplicate = saved.duplicate;
  } catch (e) {
    console.error('[orders] saveOrder failed', e);
  }

  if (!duplicate) {
    const result = await notifyTelegram(text, photo);
    if (!result.ok) console.error('[orders] telegram notify failed:', result.error);
    if (orderId !== null) await markOrderNotified(orderId, result.ok, result.error ?? null).catch(() => {});
    await incrementOrderCounts(items.map((i) => ({ id: i.id, qty: i.qty })));
    // Piggyback: any earlier order that failed to notify gets another try now.
    retryUnnotifiedOrders(orderId ?? undefined).catch(() => {});
  }

  return NextResponse.json({ ok: true, message: text });
}
