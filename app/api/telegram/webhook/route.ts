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

  // Prefer an explicit "цена ..." / "цена: ..." marker so a name that
  // itself contains a number (e.g. "Букет 9900") doesn't get mistaken for
  // the price. Falls back to the LAST number in the caption — a price
  // written at the end ("Пионы 25000") is a more common pattern than a
  // leading one once a name can also carry digits.
  const numbers = [...caption.matchAll(/\d[\d\s]{2,}\d|\d{3,}/g)];
  const labeledMatch = caption.match(/цена\s*[:\-]?\s*(\d[\d\s]*\d|\d+)/i);
  const priceRaw = labeledMatch?.[1] ?? numbers[numbers.length - 1]?.[0];
  if (!priceRaw) {
    await sendTelegramMessage(
      token,
      chatId,
      'Не нашёл цену в подписи к фото. Пришлите ещё раз с подписью вида «15000 Букет с пионами» или «Букет с пионами, цена 15000».'
    );
    return NextResponse.json({ ok: true });
  }
  const price = parseInt(priceRaw.replace(/\s/g, ''), 10);
  const name =
    caption
      .replace(labeledMatch?.[0] ?? priceRaw, '')
      .replace(/цена\s*[:\-]?\s*$/i, '')
      .replace(/[,\-–]\s*$/, '')
      .trim() || `Букет ${new Date().toLocaleDateString('ru-RU')}`;

  // Telegram sends several resolutions per photo, smallest first — take
  // the largest so catalog photos stay sharp on bigger cards and the
  // product-page gallery, at a modest cost in row size.
  const photoRef = photos[photos.length - 1];
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
