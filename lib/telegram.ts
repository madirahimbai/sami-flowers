/** Sends a message to the shop's Telegram chat via the Bot API.
 * Server-side only — the bot token never reaches the browser.
 * Silently no-ops if the env vars aren't configured, and never throws
 * (a Telegram hiccup must not block an order from reaching WhatsApp). */
export async function notifyTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch {
    // best-effort duplicate channel; failures here must not break checkout
  }
}
