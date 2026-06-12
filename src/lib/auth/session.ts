import { randomBytes, createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { pool } from '@/lib/db';

export const SESSION_COOKIE_NAME = 'session';
export const SESSION_DAYS = 30;
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

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

// Cookie format: `<rawToken>.<hmac(rawToken)>`. The HMAC lets us reject
// malformed/tampered cookies before hitting the DB. The DB only ever stores
// the SHA-256 hash, so a DB dump can't be replayed as a cookie either.
export function packCookie(rawToken: string): string {
  return `${rawToken}.${hmac(rawToken)}`;
}

export function unpackCookie(value: string | undefined): string | null {
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

export interface CreatedSession {
  rawToken: string;
  expiresAt: Date;
}

export async function createSession(opts: {
  userId: string;
  userAgent?: string | null;
  ipAddress?: string | null;
}): Promise<CreatedSession> {
  const rawToken = randomBytes(32).toString('base64url');
  const hash = tokenHash(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_MS);
  await pool.query(
    `insert into public.sessions (user_id, token_hash, user_agent, ip_address, expires_at)
     values ($1, $2, $3, $4, $5)`,
    [opts.userId, hash, opts.userAgent ?? null, opts.ipAddress ?? null, expiresAt],
  );
  return { rawToken, expiresAt };
}

export interface SessionLookup {
  userId: string;
  expiresAt: Date;
}

export async function lookupSession(rawToken: string): Promise<SessionLookup | null> {
  const hash = tokenHash(rawToken);
  const { rows } = await pool.query<{ user_id: string; expires_at: Date }>(
    `select user_id, expires_at
       from public.sessions
      where token_hash = $1
        and expires_at > now()`,
    [hash],
  );
  const row = rows[0];
  if (!row) return null;
  return { userId: row.user_id, expiresAt: row.expires_at };
}

export async function destroySession(rawToken: string): Promise<void> {
  const hash = tokenHash(rawToken);
  await pool.query('delete from public.sessions where token_hash = $1', [hash]);
}
