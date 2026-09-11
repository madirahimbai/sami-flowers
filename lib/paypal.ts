// Server-side PayPal REST API helpers (Orders v2). Client ID/secret and
// environment live in env vars — never exposed to the browser except the
// public client ID (NEXT_PUBLIC_PAYPAL_CLIENT_ID) needed to load PayPal's
// own JS SDK, which is meant to be public (it identifies the merchant app,
// not a secret).
//
// PayPal does not support KZT as a transaction currency, so the cart total
// (in тенге) is converted to USD using PAYPAL_USD_KZT_RATE — an
// approximate rate the shop owner sets and updates occasionally, not a
// live feed (avoids needing yet another API/account for exchange rates).

function apiBase(): string {
  return process.env.PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) throw new Error('PayPal credentials are not configured');
  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
  const res = await fetch(`${apiBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error('Failed to get PayPal access token');
  const data = await res.json();
  return data.access_token;
}

/** тенге -> USD, rounded to cents. */
export function kztToUsd(amountKzt: number): number {
  const rate = parseFloat(process.env.PAYPAL_USD_KZT_RATE || '480');
  return Math.round((amountKzt / rate) * 100) / 100;
}

export async function createPayPalOrder(amountKzt: number): Promise<{ orderId: string; amountUsd: number }> {
  const amountUsd = kztToUsd(amountKzt);
  if (!(amountUsd > 0)) throw new Error('Invalid order amount');
  const token = await getAccessToken();
  const res = await fetch(`${apiBase()}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: { currency_code: 'USD', value: amountUsd.toFixed(2) },
          description: 'Sami Flowers — заказ на сайте',
        },
      ],
    }),
  });
  if (!res.ok) throw new Error('Failed to create PayPal order');
  const data = await res.json();
  return { orderId: data.id, amountUsd };
}

export async function capturePayPalOrder(orderId: string): Promise<{ ok: boolean; amountUsd?: number }> {
  const token = await getAccessToken();
  const res = await fetch(`${apiBase()}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const data = await res.json().catch(() => null);
  const capture = data?.purchase_units?.[0]?.payments?.captures?.[0];
  const ok = res.ok && data?.status === 'COMPLETED' && capture?.status === 'COMPLETED';
  return { ok, amountUsd: capture ? parseFloat(capture.amount?.value) : undefined };
}
