import { listUnnotifiedOrders, markOrderNotified } from './db';
import { notifyTelegram } from './telegram';

/** Re-sends orders whose Telegram notification failed earlier (last 48h,
 * at most 5 per call). Stops at the first failure — if Telegram is down
 * there is no point hammering it. Returns how many were delivered. */
export async function retryUnnotifiedOrders(excludeId?: number): Promise<number> {
  const rows = await listUnnotifiedOrders(48, 5);
  let delivered = 0;
  for (const row of rows) {
    if (row.id === excludeId) continue;
    const result = await notifyTelegram(`🔁 Заказ не дошёл сразу — отправляю повторно:\n\n${row.text}`, row.photo);
    await markOrderNotified(row.id, result.ok, result.error ?? null);
    if (!result.ok) break;
    delivered++;
  }
  return delivered;
}
