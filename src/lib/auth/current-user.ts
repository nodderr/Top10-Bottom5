import { cookies } from 'next/headers';
import { pool } from '@/lib/db';
import { SESSION_COOKIE_NAME, lookupSession, unpackCookie } from './session';

export interface CurrentUser {
  id: string;
  email: string;
  handle: string;
  displayName: string;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const raw = unpackCookie(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!raw) return null;

  const session = await lookupSession(raw);
  if (!session) return null;

  const { rows } = await pool.query<{
    id: string;
    email: string;
    handle: string;
    display_name: string;
  }>(
    `select id, email, handle, display_name
       from public.users
      where id = $1`,
    [session.userId],
  );
  const u = rows[0];
  if (!u) return null;
  return { id: u.id, email: u.email, handle: u.handle, displayName: u.display_name };
}
