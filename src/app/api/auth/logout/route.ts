import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  SESSION_COOKIE_NAME,
  destroySession,
  unpackCookie,
} from '@/lib/auth/session';
import { clearSessionCookie } from '@/lib/auth/cookies';

export async function POST() {
  const cookieStore = await cookies();
  const raw = unpackCookie(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (raw) {
    try {
      await destroySession(raw);
    } catch (err) {
      console.error('destroySession failed', err);
      // Still clear the cookie below — better to log the user out client-side
      // than leave a stale cookie because the DB hiccupped.
    }
  }

  clearSessionCookie(cookieStore);

  return NextResponse.json({ ok: true });
}
