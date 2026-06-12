// Mirror of src/lib/auth/session.ts (Next side) for the Express socket server.
// Same cookie name, same HMAC algorithm, same token_hash scheme — so both
// processes can validate the cookie issued by the other.

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { pool } from './db';

const SESSION_COOKIE_NAME = 'session';

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error('SESSION_SECRET is not set');
  return s;
}

function hmac(input: string): string {
  return createHmac('sha256', getSecret()).update(input).digest('base64url');
}

function tokenHash(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

function unpackCookie(value: string | undefined): string | null {
  if (!value) return null;
  const idx = value.lastIndexOf('.');
  if (idx <= 0) return null;
  const raw = value.slice(0, idx);
  const sig = value.slice(idx + 1);
  const expected = hmac(raw);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;
  return raw;
}

// Minimal cookie-header parser — saves us a `cookie` dependency.
function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

export interface AuthedUser {
  userId: string;
  handle: string;
  displayName: string;
}

/**
 * Validate a short-lived ticket minted by the Next.js side. Used as the primary
 * handshake auth in prod where the session cookie cannot cross the Vercel↔Render
 * boundary. Synchronous + DB-free — the HMAC + expiry are the entire check.
 */
export function userFromTicket(ticket: string | undefined): AuthedUser | null {
  if (!ticket || typeof ticket !== 'string') return null;
  const idx = ticket.lastIndexOf('.');
  if (idx <= 0) return null;
  const payload = ticket.slice(0, idx);
  const sig = ticket.slice(idx + 1);

  const expected = hmac(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;

  try {
    const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
    const body = JSON.parse(decoded) as {
      userId?: unknown;
      handle?: unknown;
      displayName?: unknown;
      exp?: unknown;
    };
    if (
      typeof body.userId !== 'string' ||
      typeof body.handle !== 'string' ||
      typeof body.displayName !== 'string' ||
      typeof body.exp !== 'number' ||
      Date.now() > body.exp
    ) {
      return null;
    }
    return {
      userId: body.userId,
      handle: body.handle,
      displayName: body.displayName,
    };
  } catch {
    return null;
  }
}

export async function userFromCookieHeader(
  cookieHeader: string | undefined,
): Promise<AuthedUser | null> {
  const cookies = parseCookies(cookieHeader);
  const raw = unpackCookie(cookies[SESSION_COOKIE_NAME]);
  if (!raw) return null;

  const hash = tokenHash(raw);
  const { rows } = await pool.query<{
    user_id: string;
    handle: string;
    display_name: string;
  }>(
    `select s.user_id, u.handle, u.display_name
       from public.sessions s
       join public.users u on u.id = s.user_id
      where s.token_hash = $1
        and s.expires_at > now()`,
    [hash],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    userId: row.user_id,
    handle: row.handle,
    displayName: row.display_name,
  };
}
