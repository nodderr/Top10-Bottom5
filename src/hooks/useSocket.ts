'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/lib/constants';

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    console.log('[Socket] Initializing connection to:', SOCKET_URL);
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
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
