import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Railway posts deployment events here (Project → Settings → Webhooks) —
 * gives an instant alert on a failed build instead of waiting for the next
 * hourly /api/monitor run. Only failures page; a successful deploy is the
 * expected case and would just be noise.
 *
 * Railway's webhook payload shape isn't pinned down here on purpose — read
 * both the flat and nested spots a status could show up in, and only act
 * when one of them clearly says failed/crashed. An unrecognized payload is
 * logged (visible in Railway's own deploy logs for this service) rather than
 * guessed at, so it never sends a false alarm.
 *
 * POST /api/webhooks/railway?secret=<MONITOR_SECRET> */
export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (!process.env.MONITOR_SECRET || secret !== process.env.MONITOR_SECRET) {
    return NextResponse.json({ error: 'not_authorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  console.log('[railway-webhook]', JSON.stringify(body));

  const status: unknown = body?.status ?? body?.deployment?.status ?? body?.type;
  const isFailure = typeof status === 'string' && /FAIL|CRASH/i.test(status);

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (isFailure && token && chatId) {
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `⚠️ Сборка на Railway не прошла (статус: ${status}). Сайт продолжает работать на предыдущей версии — новые изменения не применились.`,
        }),
      });
    } catch {
      // best-effort — a failed alert must not turn this into a 500 for Railway
    }
  }

  return NextResponse.json({ ok: true });
}
