import { NextResponse } from 'next/server';
import { createHmac } from 'node:crypto';
import { getCurrentUser } from '@/lib/auth/current-user';

// Cross-domain handshake: in prod, frontend (Vercel) and socket server (Render)
// are different registrable domains, so the session cookie does not flow to the
// WS handshake. The Next side mints a short-lived signed ticket containing the
// user identity; the frontend hands it to socket.io via `auth.ticket`; the
// server validates it with the shared SESSION_SECRET.

const TICKET_TTL_MS = 5 * 60 * 1000; // 5 minutes

function sign(payload: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not set');
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ticket: null }, { status: 200 });

  const body = {
    userId: user.id,
    handle: user.handle,
    displayName: user.displayName,
    exp: Date.now() + TICKET_TTL_MS,
  };
  const payload = Buffer.from(JSON.stringify(body)).toString('base64url');
  const ticket = `${payload}.${sign(payload)}`;
  return NextResponse.json({ ticket });
}
