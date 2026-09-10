import { NextRequest, NextResponse } from 'next/server';
import { notifyTelegram } from '@/lib/telegram';

type OrderItem = { name: string; sizeLabel: string; qty: number; price: number };

function formatPrice(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' тнг';
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const items: OrderItem[] = body.items;
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  const lines: string[] = ['Заказ с сайта Sami Flowers:', ''];
  for (const item of items) {
    lines.push(`• ${item.name} (${item.sizeLabel}) x${item.qty} — ${formatPrice(item.price * item.qty)}`);
  }
  lines.push('', `Итого: ${formatPrice(total)}`);
  lines.push(
    body.recipientType === 'other'
      ? `Получатель: другому человеку${body.recipientName ? ' — ' + body.recipientName : ''}${body.recipientPhone ? ', тел. ' + body.recipientPhone : ''}`
      : 'Получатель: себе'
  );
  lines.push(`Заказывает: ${body.orderName || '(укажет в переписке)'}${body.orderPhone ? ', тел. ' + body.orderPhone : ''}`);
  if (body.deliveryMethod === 'courier') {
    lines.push(`Способ получения: доставка`);
    lines.push(`Адрес: ${body.address || '(уточнит в переписке)'}`);
    if (body.deliveryDate) lines.push(`Дата: ${body.deliveryDate}`);
    if (body.deliveryTime) lines.push(`Время: ${body.deliveryTime}`);
  } else {
    lines.push('Способ получения: самовывоз — Торайгырова, 73, 1 этаж');
    if (body.deliveryDate) lines.push(`Дата: ${body.deliveryDate}`);
    if (body.deliveryTime) lines.push(`Время: ${body.deliveryTime}`);
  }
  if (body.cardMessage) lines.push(`Текст на открытке: «${body.cardMessage}»`);
  if (body.comment) lines.push(`Комментарий: ${body.comment}`);

  const text = lines.join('\n');
  await notifyTelegram(text);

  return NextResponse.json({ ok: true, message: text });
}
