import { NextRequest, NextResponse } from 'next/server';
import { listProducts } from '@/lib/db';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://www.samiflowers.kz';

type CallResult = { ok: boolean; ms: number; description?: string; error_code?: number; error?: string };

/** Checks the order-notification bot end to end the same way an order does:
 * token valid, chat reachable, plain message and photo-by-URL both deliver.
 * Sends two clearly-labelled test messages to the shop chat. Never returns
 * the token itself.
 * POST with header  x-setup-secret: <TELEGRAM_WEBHOOK_SECRET> */
export async function POST(req: NextRequest) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected || req.headers.get('x-setup-secret') !== expected) {
    return NextResponse.json({ error: 'not_authorized' }, { status: 401 });
  }
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const out: Record<string, unknown> = { tokenSet: !!token, chatIdSet: !!chatId };
  if (!token || !chatId) return NextResponse.json(out);

  async function call(method: string, body?: Record<string, unknown>): Promise<CallResult & { result?: unknown }> {
    const start = Date.now();
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body ?? {}),
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json();
      return { ok: !!data.ok, ms: Date.now() - start, description: data.description, error_code: data.error_code, result: data.result };
    } catch (e: any) {
      return { ok: false, ms: Date.now() - start, error: e.message };
    }
  }

  const me = await call('getMe');
  out.getMe = { ok: me.ok, ms: me.ms, description: me.description, username: (me.result as any)?.username };
  const chat = await call('getChat', { chat_id: chatId });
  out.getChat = { ok: chat.ok, ms: chat.ms, description: chat.description, type: (chat.result as any)?.type };
  const msg = await call('sendMessage', {
    chat_id: chatId,
    text: '🔧 Тест связи сайта с ботом заказов. Если вы видите это сообщение — заказы будут приходить сюда.',
  });
  out.sendMessage = { ok: msg.ok, ms: msg.ms, description: msg.description, error_code: msg.error_code, error: msg.error };

  const products = await listProducts();
  const withPhoto = products.find((p) => p.image);
  if (withPhoto?.image) {
    const photoUrl = withPhoto.image.startsWith('http') ? withPhoto.image : `${SITE_URL}${withPhoto.image}`;
    const photo = await call('sendPhoto', { chat_id: chatId, photo: photoUrl, caption: '🔧 Тест: заказ с фото букета' });
    out.sendPhoto = { ok: photo.ok, ms: photo.ms, description: photo.description, error_code: photo.error_code, error: photo.error };
  }
  return NextResponse.json(out);
}
