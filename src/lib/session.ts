// localStorage-backed session — survives page refresh / tab close.
// Server gives us a playerToken on create/join; we hand it back on rejoin_room
// so the server can rebind our Player record to the new socket id.

const KEY = 't10b5_session';

export interface StoredSession {
  roomCode: string;
  playerToken: string;
  playerName: string;
}

export function readSession(): StoredSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    if (!parsed.roomCode || !parsed.playerToken) return null;
    return {
      roomCode: parsed.roomCode,
      playerToken: parsed.playerToken,
      playerName: parsed.playerName ?? '',
    };
  } catch {
    return null;
  }
}

export function writeSession(s: StoredSession): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // localStorage can throw in private mode / quota — safe to ignore.
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
