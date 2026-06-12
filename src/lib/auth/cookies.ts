import type { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from './session';

type CookieStore = Awaited<ReturnType<typeof cookies>>;

const isProd = process.env.NODE_ENV === 'production';

// In production, frontend (Vercel) and socket server (Render) are cross-site,
// so the cookie has to be SameSite=None;Secure for the browser to send it on
// the WebSocket handshake. Locally we stay on Lax (Secure would block HTTP).
function sessionCookieOpts(expiresOrMaxAge: { expires: Date } | { maxAge: number }) {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? ('none' as const) : ('lax' as const),
    path: '/',
    ...expiresOrMaxAge,
  };
}

export function setSessionCookie(store: CookieStore, value: string, expiresAt: Date) {
  store.set(SESSION_COOKIE_NAME, value, sessionCookieOpts({ expires: expiresAt }));
}

export function clearSessionCookie(store: CookieStore) {
  store.set(SESSION_COOKIE_NAME, '', sessionCookieOpts({ maxAge: 0 }));
}
