import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'open-canvas-session';
const SESSION_SECONDS = 60 * 60 * 24 * 7;

function secret() {
  const value = process.env.AUTH_SECRET || (process.env.NODE_ENV === 'development' ? 'local-development-secret-change-me' : '');
  if (value.length < 32) throw new Error('AUTH_SECRET must contain at least 32 characters in production.');
  return value;
}

function signature(payload: string) {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function createSession() {
  const payload = Buffer.from(JSON.stringify({ sub: 'admin', exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })).toString('base64url');
  return `${payload}.${signature(payload)}`;
}

export function verifySession(token: string | undefined | null) {
  if (!token) return false;
  const [payload, supplied, extra] = token.split('.');
  if (!payload || !supplied || extra) return false;
  const expected = signature(payload);
  const left = Buffer.from(supplied);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return false;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { sub?: string; exp?: number };
    return parsed.sub === 'admin' && typeof parsed.exp === 'number' && parsed.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

export function sessionFromRequest(request: Request) {
  const cookies = request.headers.get('cookie') || '';
  const value = cookies.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
  return verifySession(value ? decodeURIComponent(value) : null);
}

export function verifyAdminPassword(candidate: string) {
  const configured = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === 'development' ? 'change-me' : '');
  if (!configured) throw new Error('ADMIN_PASSWORD is required in production.');
  const left = Buffer.from(candidate);
  const right = Buffer.from(configured);
  return left.length === right.length && timingSafeEqual(left, right);
}

function shouldUseSecureCookie(request: Request) {
  const configured = process.env.COOKIE_SECURE?.trim().toLowerCase();
  if (configured === 'true') return true;
  if (configured === 'false') return false;

  // Proxies commonly terminate TLS before forwarding over HTTP. Prefer the
  // original scheme when one is supplied, otherwise use the request URL.
  const forwardedProtocol = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase();
  return forwardedProtocol ? forwardedProtocol === 'https' : new URL(request.url).protocol === 'https:';
}

export function sessionCookie(token: string, request: Request) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_SECONDS}${shouldUseSecureCookie(request) ? '; Secure' : ''}`;
}

export function expiredSessionCookie(request: Request) {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${shouldUseSecureCookie(request) ? '; Secure' : ''}`;
}
