import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { pool } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { createSession, packCookie } from '@/lib/auth/session';
import { setSessionCookie } from '@/lib/auth/cookies';
import { normalizeEmail } from '@/lib/auth/validation';

interface LoginBody {
  email?: unknown;
  password?: unknown;
}

export async function POST(req: NextRequest) {
  let body: LoginBody;
  try {
    body = (await req.json()) as LoginBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (typeof body.email !== 'string' || typeof body.password !== 'string') {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }
  const email = normalizeEmail(body.email);

  const { rows } = await pool.query<{
    id: string;
    email: string;
    handle: string;
    display_name: string;
    password_hash: string;
  }>(
    `select id, email, handle, display_name, password_hash
       from public.users
      where email = $1`,
    [email],
  );
  const user = rows[0];
  // Generic message + always run verify to keep timing consistent.
  const fakeHash = '$2a$12$CwTycUXWue0Thq9StjUM0uJ8FdcEtJVjQ0fH3PgIuO.Ip7Fb6L4ja';
  const ok = await verifyPassword(body.password, user?.password_hash ?? fakeHash);

  if (!user || !ok) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  const session = await createSession({
    userId: user.id,
    userAgent: req.headers.get('user-agent'),
    ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? null,
  });

  const cookieStore = await cookies();
  setSessionCookie(cookieStore, packCookie(session.rawToken), session.expiresAt);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      handle: user.handle,
      displayName: user.display_name,
    },
  });
}
