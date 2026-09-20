import { compressImage } from './image';

const SITE_URL = 'https://www.samiflowers.kz';

/** Sends the order to the shop's Telegram chat via the Bot API — with the
 * bouquet's photo attached when one is available, so staff see the order
 * text and the picture together instead of having to open the site.
 * Server-side only — the bot token never reaches the browser.
 * Silently no-ops if the env vars aren't configured, and never throws
 * (a Telegram hiccup must not block an order from reaching WhatsApp).
 *
 * `photo` can be either a data: URI (product detail page — real base64 from
 * the DB) or a `/api/products/{id}/image` path (catalog cards — the
 * lightweight listing only carries a URL, not the photo bytes). Telegram's
 * sendPhoto accepts a plain URL and fetches it itself, so the URL case
 * doesn't need decoding at all. */
export async function notifyTelegram(text: string, photo?: string | null): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const sendText = () =>
    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });

  // Telegram caption limit is 1024 chars — send the full text separately
  // when the order details don't fit.
  const fitsCaption = text.length <= 1024;
  const caption = fitsCaption ? text : text.slice(0, 1000) + '…';

  try {
    const dataMatch = photo?.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    let res: Response;

    if (dataMatch) {
      const [, mime, base64] = dataMatch;
      const buf = Buffer.from(base64, 'base64');
      const form = new FormData();
      form.append('chat_id', chatId);
      form.append('caption', caption);
      form.append('photo', new Blob([buf], { type: mime }), 'order.jpg');
      res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, { method: 'POST', body: form });
    } else if (photo) {
      const photoUrl = photo.startsWith('http') ? photo : `${SITE_URL}${photo}`;
      res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption }),
      });
    } else {
      await sendText();
      return;
    }

    if (!res.ok) {
      await sendText();
      return;
    }
    if (!fitsCaption) await sendText();
  } catch {
    // best-effort duplicate channel; failures here must not break checkout
  }
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
