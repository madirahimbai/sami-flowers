import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * One-time setup: points the bot's webhook at this deployment. Call once
 * after deploying (or again if the domain ever changes) with header
 * x-setup-secret matching TELEGRAM_WEBHOOK_SECRET.
 *
 * Usage: POST /api/telegram/setup-webhook  with header  x-setup-secret: <TELEGRAM_WEBHOOK_SECRET>
 */
export async function POST(req: NextRequest) {
  const provided = req.headers.get('x-setup-secret');
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: 'not_authorized' }, { status: 401 });
  }
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'missing_bot_token' }, { status: 500 });
  }

  const webhookUrl = `${req.nextUrl.origin}/api/telegram/webhook`;
  const res = await fetch(
    `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}&secret_token=${expected}`
  );
  const data = await res.json();
  return NextResponse.json(data);
}
