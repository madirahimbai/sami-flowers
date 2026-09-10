// Uses the Web Crypto API (globalThis.crypto.subtle) rather than Node's
// `crypto` module, so this file works identically in Edge Middleware and
// in ordinary (Node.js runtime) API routes.

const COOKIE_NAME = 'sami_admin';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error('ADMIN_SESSION_SECRET is not set');
  return s;
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return toHex(sig);
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Builds a signed cookie value: "<expiryMs>.<hmacHex>" */
export async function createSessionValue(): Promise<string> {
  const expiry = Date.now() + SESSION_TTL_MS;
  const payload = String(expiry);
  return `${payload}.${await hmac(payload)}`;
}

export async function verifySessionValue(value: string | undefined | null): Promise<boolean> {
  if (!value) return false;
  const [payload, mac] = value.split('.');
  if (!payload || !mac) return false;
  const expiry = parseInt(payload, 10);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;
  const expectedMac = await hmac(payload);
  return timingSafeEqualStr(mac, expectedMac);
}

export function checkPassword(candidate: string): boolean {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return false;
  return timingSafeEqualStr(candidate, real);
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;

/** Node-runtime-only helper for Route Handlers: reads the incoming
 * cookie jar via next/headers. Do not import this from middleware.ts
 * (Edge) or a Client Component. */
export async function isAdminFromCookies(): Promise<boolean> {
  const { cookies } = await import('next/headers');
  const value = cookies().get(COOKIE_NAME)?.value;
  return verifySessionValue(value);
}

