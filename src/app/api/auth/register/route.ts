import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { pool } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { createSession, packCookie } from '@/lib/auth/session';
import { setSessionCookie } from '@/lib/auth/cookies';
import {
  validateEmail,
  validatePassword,
  validateHandle,
  validateDisplayName,
  normalizeEmail,
  normalizeHandle,
} from '@/lib/auth/validation';

interface RegisterBody {
  email?: unknown;
  password?: unknown;
  handle?: unknown;
  displayName?: unknown;
}

export async function POST(req: NextRequest) {
  let body: RegisterBody;
  try {
    body = (await req.json()) as RegisterBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const errors = [
    validateEmail(body.email),
    validatePassword(body.password),
    validateHandle(body.handle),
    validateDisplayName(body.displayName),
  ].filter((e): e is string => e !== null);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0] }, { status: 400 });
  }

  const email = normalizeEmail(body.email as string);
  const handle = normalizeHandle(body.handle as string);
  const displayName = (body.displayName as string).trim();
  const passwordHash = await hashPassword(body.password as string);

  let userId: string;
  try {
    const { rows } = await pool.query<{ id: string }>(
      `insert into public.users (email, password_hash, handle, display_name)
       values ($1, $2, $3, $4)
       returning id`,
      [email, passwordHash, handle, displayName],
    );
    userId = rows[0].id;
    // Initialize ELO row so the user appears in the leaderboard once they play.
    await pool.query(
      `insert into public.elo_ratings (user_id) values ($1)
       on conflict (user_id) do nothing`,
      [userId],
    );
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    const detail = (err as { constraint?: string })?.constraint;
    if (code === '23505') {
      if (detail === 'users_email_key') {
        return NextResponse.json({ error: 'That email is already registered.' }, { status: 409 });
      }
      if (detail === 'users_handle_key') {
        return NextResponse.json({ error: 'That handle is taken.' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Account already exists.' }, { status: 409 });
    }
    console.error('register failed', err);
    return NextResponse.json({ error: 'Could not create account.' }, { status: 500 });
  }

  const session = await createSession({
    userId,
    userAgent: req.headers.get('user-agent'),
    ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? null,
  });

  const cookieStore = await cookies();
  setSessionCookie(cookieStore, packCookie(session.rawToken), session.expiresAt);

  return NextResponse.json(
    {
      user: { id: userId, email, handle, displayName },
    },
    { status: 201 },
  );
}
