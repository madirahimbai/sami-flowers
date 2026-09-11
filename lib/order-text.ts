export type OrderItem = { id: string; name: string; sizeLabel: string; qty: number; price: number; image?: string | null };

export type OrderBody = {
  recipientType?: string;
  recipientName?: string;
  recipientPhone?: string;
  orderName?: string;
  orderPhone?: string;
  deliveryMethod?: string;
  address?: string;
  pickupAddress?: string;
  deliveryDate?: string;
  deliveryTime?: string;
  cardMessage?: string;
  comment?: string;
};

export function formatPrice(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' тнг';
}

/** Builds the order-summary text shared by the WhatsApp/Telegram checkout
 * flow and the PayPal-paid checkout flow — `paymentNote` (e.g. "Оплата:
 * PayPal ✅") is appended when the order was already paid online. */
export function buildOrderText(body: OrderBody, items: OrderItem[], paymentNote?: string): string {
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  const lines: string[] = ['Заказ с сайта Sami Flowers:', ''];
  for (const item of items) {
    lines.push(`• ${item.name} (${item.sizeLabel}) x${item.qty} — ${formatPrice(item.price * item.qty)}`);
  }
  lines.push('', `Итого: ${formatPrice(total)}`);
  if (paymentNote) lines.push(paymentNote);
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
    lines.push(`Способ получения: самовывоз — ${body.pickupAddress || 'Торайгырова, 73, 1 этаж'}`);
    if (body.deliveryDate) lines.push(`Дата: ${body.deliveryDate}`);
    if (body.deliveryTime) lines.push(`Время: ${body.deliveryTime}`);
  }
  if (body.cardMessage) lines.push(`Текст на открытке: «${body.cardMessage}»`);
  if (body.comment) lines.push(`Комментарий: ${body.comment}`);

  return lines.join('\n');
}
