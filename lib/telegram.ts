/** Sends the order to the shop's Telegram chat via the Bot API — with the
 * bouquet's photo attached when one is available, so staff see the order
 * text and the picture together instead of having to open the site.
 * Server-side only — the bot token never reaches the browser.
 * Silently no-ops if the env vars aren't configured, and never throws
 * (a Telegram hiccup must not block an order from reaching WhatsApp). */
export async function notifyTelegram(text: string, photoDataUri?: string | null): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const sendText = () =>
    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });

  try {
    const match = photoDataUri?.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) {
      await sendText();
      return;
    }

    const [, mime, base64] = match;
    const buf = Buffer.from(base64, 'base64');
    // Telegram caption limit is 1024 chars — send the full text separately
    // when the order details don't fit.
    const fitsCaption = text.length <= 1024;
    const form = new FormData();
    form.append('chat_id', chatId);
    form.append('caption', fitsCaption ? text : text.slice(0, 1000) + '…');
    form.append('photo', new Blob([buf], { type: mime }), 'order.jpg');

    const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, { method: 'POST', body: form });
    if (!res.ok) {
      await sendText();
      return;
    }
    if (!fitsCaption) await sendText();
  } catch {
    // best-effort duplicate channel; failures here must not break checkout
  }
}
