import { NextRequest, NextResponse } from 'next/server';
import { upsertProduct } from '@/lib/db';
import { sendTelegramMessage, downloadTelegramPhoto } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

/**
 * Telegram webhook — lets the shop owner add a bouquet straight from the
 * Telegram app: send the bot a photo with a caption containing the price
 * (and optionally a name), and it lands in the catalog automatically.
 *
 * This is a SEPARATE bot from TELEGRAM_BOT_TOKEN (the one that duplicates
 * orders) — its own token/chat live in TELEGRAM_PRODUCTS_BOT_TOKEN /
 * TELEGRAM_PRODUCTS_CHAT_ID, so order messages and catalog uploads never
 * mix in one chat.
 *
 * Registered once via POST /api/telegram/setup-webhook. Telegram signs
 * every webhook call with the secret_token we set at registration, checked
 * below against TELEGRAM_WEBHOOK_SECRET — without it, anyone who guessed
 * this URL could POST fake updates and spam products into the store.
 * Only messages from a chat id listed in TELEGRAM_PRODUCTS_CHAT_ID are
 * honored — a comma-separated list, so several staff members' private
 * chats (or one shared group's id) can all be trusted at once.
 */
export async function POST(req: NextRequest) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const providedSecret = req.headers.get('x-telegram-bot-api-secret-token');
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: 'not_authorized' }, { status: 401 });
  }

  const token = process.env.TELEGRAM_PRODUCTS_BOT_TOKEN;
  if (!token) return NextResponse.json({ ok: true });

  const update = await req.json().catch(() => null);
  const message = update?.message;
  if (!message) return NextResponse.json({ ok: true });

  const chatId = String(message.chat?.id ?? '');
  const allowedChatIds = (process.env.TELEGRAM_PRODUCTS_CHAT_ID || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowedChatIds.length === 0 || !allowedChatIds.includes(chatId)) {
    return NextResponse.json({ ok: true }); // silently ignore anyone else who finds the bot
  }

  const photos = message.photo as Array<{ file_id: string }> | undefined;
  const caption: string = message.caption || '';

  if (!photos || photos.length === 0) {
    if (message.text) {
      await sendTelegramMessage(
        token,
        chatId,
        'Чтобы добавить букет в каталог, пришлите фото с подписью — цена и название. Например: «15000 Букет с пионами».'
      );
    }
    return NextResponse.json({ ok: true });
  }

  const priceMatch = caption.match(/\d[\d\s]{2,}/);
  if (!priceMatch) {
    await sendTelegramMessage(
      token,
      chatId,
      'Не нашёл цену в подписи к фото. Пришлите ещё раз с подписью вида «15000 Букет с пионами».'
    );
    return NextResponse.json({ ok: true });
  }
  const price = parseInt(priceMatch[0].replace(/\s/g, ''), 10);
  const name = caption.replace(priceMatch[0], '').trim() || `Букет ${new Date().toLocaleDateString('ru-RU')}`;

  // Telegram sends several resolutions per photo, smallest first — the
  // second-largest is plenty for the site and keeps the stored row small.
  const photoRef = photos[Math.max(0, photos.length - 2)];
  const image = await downloadTelegramPhoto(token, photoRef.file_id);
  if (!image) {
    await sendTelegramMessage(token, chatId, 'Не удалось скачать фото из Telegram, попробуйте отправить ещё раз.');
    return NextResponse.json({ ok: true });
  }

  const id = `tg-${Date.now()}`;
  await upsertProduct({
    id,
    name,
    number: null,
    price,
    description: null,
    image,
    images: [image],
    category: 'bouquet',
    tag: null,
    available: true,
  });

  await sendTelegramMessage(
    token,
    chatId,
    `✅ Добавлено в каталог: «${name}» — ${price.toLocaleString('ru-RU')} тнг\nМожно поправить название/описание в админке.`
  );
  return NextResponse.json({ ok: true });
}
