'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/lib/constants';

let socket: Socket | null = null;

// Cross-domain handshake auth: in prod the session cookie cannot reach the
// socket server, so we mint a short-lived signed ticket on the Next side and
// hand it over via socket.io's `auth` field. The function form runs on every
// (re)connect attempt, so we always send a fresh ticket.
async function fetchTicket(): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/socket-ticket', {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { ticket?: string | null };
    return data.ticket ?? null;
  } catch {
    return null;
  }
}

function getSocket(): Socket {
  if (!socket) {
    console.log('[Socket] Initializing connection to:', SOCKET_URL);
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      // Cookie path (only effective when frontend + server share a site, e.g. local dev).
      withCredentials: true,
      // Ticket path (works cross-domain in prod).
      auth: (cb: (data: { ticket?: string | null }) => void) => {
        void fetchTicket().then((ticket) => cb({ ticket }));
      },
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected successfully! ID:', socket?.id);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error details:', err);
    });

    socket.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', reason);
    });
  }
  return socket;
}

/**
 * Force the singleton socket to disconnect + reconnect. Used after auth changes
 * so the next handshake fetches a fresh ticket reflecting the new identity.
 */
export function reconnectSocket(): void {
  if (!socket) return;
  socket.disconnect();
  socket.connect();
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = getSocket();

    return () => {
      // Don't disconnect on unmount — socket is shared/singleton
    };
  }, []);

  const emit = useCallback(<T = unknown>(event: string, data?: T) => {
    console.log(`[Socket] Emitting event: "${event}"`, data);
    getSocket().emit(event, data);
  }, []);

  const on = useCallback(<T = unknown>(event: string, handler: (data: T) => void) => {
    const s = getSocket();
    const wrappedHandler = (data: T) => {
      console.log(`[Socket] Received event: "${event}"`, data);
      handler(data);
    };
    s.on(event, wrappedHandler);
    return () => { s.off(event, wrappedHandler); };
  }, []);

  const off = useCallback((event: string, handler?: (...args: unknown[]) => void) => {
    getSocket().off(event, handler);
  }, []);

  const getId = useCallback(() => getSocket().id, []);
  const isConnected = useCallback(() => getSocket().connected, []);

  return {
    socket: socketRef,
    emit,
    on,
    off,
    getId,
    isConnected,
  };
}
