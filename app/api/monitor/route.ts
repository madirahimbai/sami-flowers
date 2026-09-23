import { NextRequest, NextResponse } from 'next/server';
import { getMonitorState, setMonitorState, MonitorCheckName } from '@/lib/db';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://www.samiflowers.kz';

const LABELS: Record<MonitorCheckName, string> = {
  site: 'Сайт недоступен или отвечает медленно',
  telegram_token: 'Бот заказов сломан (токен недействителен)',
  telegram_delivery: 'Бот заказов не может написать вам',
};

type CheckResult = { ok: boolean; detail: string | null };

async function checkSite(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const res = await fetch(SITE_URL, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    const buf = await res.arrayBuffer();
    const time = Date.now() - start;
    if (!res.ok) return { ok: false, detail: `сайт вернул код ${res.status}` };
    if (time > 5000) return { ok: false, detail: `главная открывается ${(time / 1000).toFixed(1)} сек` };
    if (buf.byteLength > 2_000_000) {
      return { ok: false, detail: `главная весит ${(buf.byteLength / 1024 / 1024).toFixed(1)} МБ` };
    }
    return { ok: true, detail: null };
  } catch (e: any) {
    return { ok: false, detail: `сайт не отвечает (${e.message})` };
  }
}

async function checkTelegramToken(token: string): Promise<CheckResult> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`, { signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    return data.ok ? { ok: true, detail: null } : { ok: false, detail: 'токен бота недействителен' };
  } catch (e: any) {
    return { ok: false, detail: `не удалось проверить бота (${e.message})` };
  }
}

// Uses sendChatAction ("typing…") instead of sendMessage as the canary — it
// requires the exact same permission Telegram checks for sendPhoto/sendMessage
// (fails the same way if the bot can't message this chat), but doesn't leave
// a visible message, so this can run every hour without spamming the chat.
async function checkTelegramDelivery(token: string, chatId: string): Promise<CheckResult> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, action: 'typing' }),
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();
    return data.ok ? { ok: true, detail: null } : { ok: false, detail: data.description || 'бот не может написать вам' };
  } catch (e: any) {
    return { ok: false, detail: `не удалось проверить доставку (${e.message})` };
  }
}

async function sendAlert(token: string, chatId: string, text: string) {
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch {
    // if Telegram itself is what's broken, there's no channel left to alert on —
    // the JSON response below is the fallback way to see current status
  }
}

/** Hourly health check, meant to be pinged by an external cron service (this
 * app has no cron of its own). Sends a Telegram alert only when a check's
 * result actually changes — "just broke" or "just recovered" — not on every
 * run, so a still-broken check doesn't page every hour.
 *
 * GET /api/monitor?secret=<MONITOR_SECRET> */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (!process.env.MONITOR_SECRET || secret !== process.env.MONITOR_SECRET) {
    return NextResponse.json({ error: 'not_authorized' }, { status: 401 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  const results: Record<MonitorCheckName, CheckResult> = {
    site: await checkSite(),
    telegram_token: token ? await checkTelegramToken(token) : { ok: false, detail: 'TELEGRAM_BOT_TOKEN не настроен' },
    telegram_delivery:
      token && chatId ? await checkTelegramDelivery(token, chatId) : { ok: false, detail: 'TELEGRAM_CHAT_ID не настроен' },
  };

  for (const name of Object.keys(results) as MonitorCheckName[]) {
    const result = results[name];
    const prevOk = await getMonitorState(name);
    if (prevOk !== null && prevOk !== result.ok && token && chatId) {
      const text = result.ok
        ? `✅ Восстановлено: ${LABELS[name]}`
        : `⚠️ Проблема: ${LABELS[name]}${result.detail ? ` — ${result.detail}` : ''}`;
      await sendAlert(token, chatId, text);
    }
    await setMonitorState(name, result.ok, result.detail);
  }

  return NextResponse.json({ ok: true, checked_at: new Date().toISOString(), results });
}
