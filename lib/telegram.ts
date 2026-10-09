import { compressImage } from './image';

const SITE_URL = 'https://www.samiflowers.kz';

export type NotifyResult = { ok: boolean; error?: string };

const TELEGRAM_TIMEOUT_MS = 12000;

async function tgCall(token: string, method: string, init: RequestInit): Promise<NotifyResult> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      ...init,
      signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.ok) return { ok: true };
    return { ok: false, error: data?.description || `HTTP ${res.status}` };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'network_error' };
  }
}

async function notifyOnce(text: string, photo: string | null | undefined): Promise<NotifyResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { ok: false, error: 'TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID не настроены' };

  const sendText = () =>
    tgCall(token, 'sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });

  // Telegram caption limit is 1024 chars — send the full text separately
  // when the order details don't fit.
  const fitsCaption = text.length <= 1024;
  const caption = fitsCaption ? text : text.slice(0, 1000) + '…';

  const dataMatch = photo?.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  let sent: NotifyResult;

  if (dataMatch) {
    const [, mime, base64] = dataMatch;
    const form = new FormData();
    form.append('chat_id', chatId);
    form.append('caption', caption);
    form.append('photo', new Blob([Buffer.from(base64, 'base64')], { type: mime }), 'order.jpg');
    sent = await tgCall(token, 'sendPhoto', { method: 'POST', body: form });
  } else if (photo) {
    const photoUrl = photo.startsWith('http') ? photo : `${SITE_URL}${photo}`;
    sent = await tgCall(token, 'sendPhoto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption }),
    });
  } else {
    return sendText();
  }

  // Photo couldn't be delivered (bad image, Telegram can't fetch the URL) —
  // the order text itself must still arrive.
  if (!sent.ok) return sendText();
  if (!fitsCaption) await sendText();
  return sent;
}

/** Sends the order to the shop's Telegram chat — with the bouquet's photo
 * when available. Retries up to 3 times (a single Telegram/network blip must
 * not lose an order notification) and reports the outcome instead of hiding
 * it, so the caller can record a failure and retry later. Never throws.
 * Server-side only — the bot token never reaches the browser.
 *
 * `photo` can be a data: URI (product detail page) or a
 * `/api/products/{id}/image` path (catalog cards) — Telegram fetches a URL
 * itself, so that case needs no decoding. */
export async function notifyTelegram(text: string, photo?: string | null): Promise<NotifyResult> {
  let last: NotifyResult = { ok: false, error: 'not_attempted' };
  for (let attempt = 0; attempt < 3; attempt++) {
    last = await notifyOnce(text, photo);
    if (last.ok) return last;
    if (attempt < 2) await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
  }
  return last;
}

/** Plain text reply — used by the webhook to confirm/explain, not tied to
 * the order-notification formatting above. Takes an explicit token because
 * the product-adding bot is a separate Telegram bot from the order-notify
 * one, so nothing mixes in one chat. */
export async function sendTelegramMessage(token: string, chatId: string, text: string): Promise<void> {
  if (!token) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch {
    // best-effort — a failed reply must not break webhook processing
  }
}

/** Downloads a photo the shop owner sent to the bot and returns it as a
 * data: URI, ready to store on a product row the same way admin-panel
 * uploads are. */
export async function downloadTelegramPhoto(token: string, fileId: string): Promise<string | null> {
  if (!token) return null;
  try {
    const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    const fileData = await fileRes.json();
    const filePath: string | undefined = fileData?.result?.file_path;
    if (!filePath) return null;
    const download = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
    if (!download.ok) return null;
    const buf = Buffer.from(await download.arrayBuffer());
    return await compressImage(buf);
  } catch {
    return null;
  }
}
