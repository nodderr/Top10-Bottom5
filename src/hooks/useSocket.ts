'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/lib/constants';

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
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
    getSocket().emit(event, data);
  }, []);

  const on = useCallback(<T = unknown>(event: string, handler: (data: T) => void) => {
    const s = getSocket();
    s.on(event, handler);
    return () => { s.off(event, handler); };
  }, []);

  const off = useCallback((event: string, handler?: (...args: unknown[]) => void) => {
    getSocket().off(event, handler);
  }, []);

  return {
    socket: socketRef,
    emit,
    on,
    off,
    getId: () => getSocket().id,
    isConnected: () => getSocket().connected,
  };
}
