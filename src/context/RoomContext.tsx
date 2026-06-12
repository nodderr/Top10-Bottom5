'use client';

import React, { createContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { readSession, writeSession, clearSession } from '@/lib/session';
import {
  GameState, Player, RoomState, RoundState,
  RevealedAnswer, GameEndState, RoundEndState, GuessResult, ToastMessage, ChatMessage,
  RoundEloDelta,
} from '@/types/game';
import { useAuth } from '@/context/AuthContext';

interface RoomStoreState {
  myId: string | null;
  roomCode: string | null;
  roomState: RoomState | null;
  roundState: RoundState | null;
  roundEndState: RoundEndState | null;
  gameEndState: GameEndState | null;
  gameState: GameState;
  toasts: ToastMessage[];
  chatMessages: ChatMessage[];
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  // Per-handle cumulative ELO delta across the current game. Resets on
  // create_room / RESET_ALL. Updated each round_end from RoundEndState.eloChanges.
  gameEloTotals: Record<string, number>;
  latestRoundElo: RoundEloDelta[];
}

type Action =
  | { type: 'SET_MY_ID'; id: string }
  | { type: 'SET_ROOM_CODE'; code: string }
  | { type: 'ROOM_UPDATED'; payload: RoomState }
  | { type: 'GAME_STARTED'; payload: Omit<RoundState, 'revealed'> }
  | { type: 'ANSWER_REVEALED'; revealed: RevealedAnswer[]; scores: Record<string, number>; players: Player[] }
  | { type: 'LEADERBOARD_UPDATE'; scores: Record<string, number>; players: Player[] }
  | { type: 'TIMER_UPDATE'; seconds: number }
  | { type: 'ROUND_END'; payload: RoundEndState }
  | { type: 'GAME_END'; payload: GameEndState }
  | { type: 'ADD_TOAST'; toast: ToastMessage }
  | { type: 'REMOVE_TOAST'; id: string }
  | { type: 'ADD_CHAT_MESSAGE'; message: ChatMessage }
  | { type: 'SET_CONNECTION'; status: 'connecting' | 'connected' | 'disconnected' }
  | { type: 'RESET' }
  | { type: 'RESET_ALL' };

const initialState: RoomStoreState = {
  myId: null,
  roomCode: null,
  roomState: null,
  roundState: null,
  roundEndState: null,
  gameEndState: null,
  gameState: 'waiting',
  toasts: [],
  chatMessages: [],
  connectionStatus: 'connecting',
  gameEloTotals: {},
  latestRoundElo: [],
};

function reducer(state: RoomStoreState, action: Action): RoomStoreState {
  switch (action.type) {
    case 'SET_MY_ID':
      return { ...state, myId: action.id };
    case 'SET_ROOM_CODE':
      return { ...state, roomCode: action.code };
    case 'ROOM_UPDATED':
      return {
        ...state,
        roomState: action.payload,
        gameState: action.payload.state,
      };
    case 'GAME_STARTED':
      return {
        ...state,
        gameState: 'playing',
        roundEndState: null,
        gameEndState: null,
        roundState: { ...action.payload, revealed: [] },
      };
    case 'ANSWER_REVEALED':
      return {
        ...state,
        roomState: state.roomState
          ? { ...state.roomState, players: action.players, scores: action.scores }
          : state.roomState,
        roundState: state.roundState
          ? { ...state.roundState, revealed: action.revealed }
          : state.roundState,
      };
    case 'LEADERBOARD_UPDATE':
      return {
        ...state,
        roomState: state.roomState
          ? { ...state.roomState, players: action.players, scores: action.scores }
          : state.roomState,
      };
    case 'TIMER_UPDATE':
      return {
        ...state,
        roundState: state.roundState
          ? { ...state.roundState, timerSeconds: action.seconds }
          : state.roundState,
      };
    case 'ROUND_END': {
      // Fold ELO deltas into a running per-handle total for the current game,
      // so GameEndScreen can show cumulative change without recomputing.
      const eloChanges = action.payload.eloChanges ?? [];
      const nextTotals = { ...state.gameEloTotals };
      for (const c of eloChanges) {
        nextTotals[c.handle] = (nextTotals[c.handle] ?? 0) + c.delta;
      }
      return {
        ...state,
        gameState: action.payload.isLastRound ? 'game_end' : 'round_end',
        roundEndState: action.payload,
        roundState: state.roundState
          ? { ...state.roundState, allAnswers: action.payload.allAnswers }
          : state.roundState,
        latestRoundElo: eloChanges,
        gameEloTotals: nextTotals,
      };
    }
    case 'GAME_END':
      return { ...state, gameState: 'game_end', gameEndState: action.payload };
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts.slice(-4), action.toast] };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };
    case 'ADD_CHAT_MESSAGE':
      return { ...state, chatMessages: [...state.chatMessages, action.message] };
    case 'SET_CONNECTION':
      return { ...state, connectionStatus: action.status };
    case 'RESET':
      // Preserve room identity — server doesn't re-emit room_created on play_again,
      // so clearing roomCode here would orphan the lobby UI. Only blow away round + end state.
      return {
        ...initialState,
        myId: state.myId,
        connectionStatus: state.connectionStatus,
        roomCode: state.roomCode,
        roomState: state.roomState,
      };
    case 'RESET_ALL':
      // Hard reset for leaving the room entirely — drop everything room-scoped
      // but keep socket identity + connection state.
      return {
        ...initialState,
        myId: state.myId,
        connectionStatus: state.connectionStatus,
      };
    default:
      return state;
  }
}

interface RoomContextType extends RoomStoreState {
  isHost: boolean;
  createRoom: (playerName: string, totalRounds?: number, timerSeconds?: number, customPrompts?: string[]) => void;
  joinRoom: (roomCode: string, playerName: string) => void;
  startGame: () => void;
  submitGuess: (guess: string) => void;
  nextRound: () => void;
  playAgain: () => void;
  leaveRoom: () => void;
  addToast: (type: ToastMessage['type'], message: string, points?: number) => void;
}

export const RoomContext = createContext<RoomContextType | null>(null);

let toastCounter = 0;

export function RoomProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { emit, on, getId } = useSocket();
  const { user } = useAuth();
  // Live ref to the playerToken from the most-recent successful create/join/rejoin.
  // Used to attempt rejoin on every socket reconnect (which assigns a new socket.id).
  const playerTokenRef = useRef<string | null>(null);
  // Pending name from create/join — captured at submit, recorded into the session
  // once the server confirms with a playerToken.
  const pendingNameRef = useRef<string>('');
  // Live ref to the authed user so the round_end handler (subscribed once)
  // can read the current handle without re-subscribing on each auth change.
  const userHandleRef = useRef<string | null>(null);
  useEffect(() => {
    userHandleRef.current = user?.handle ?? null;
  }, [user]);

  const addToast = useCallback((type: ToastMessage['type'], message: string, points?: number) => {
    const id = String(++toastCounter);
    const toast: ToastMessage = { id, type, message, points };
    dispatch({ type: 'ADD_TOAST', toast });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', id }), 3500);
  }, []);

  useEffect(() => {
    // Track socket id on initial connect AND on every reconnect — socket.io assigns a
    // fresh id after disconnect, so a once-only poll would leave isHost / (you) stale.
    const checkId = setInterval(() => {
      const id = getId();
      if (id) {
        dispatch({ type: 'SET_MY_ID', id });
        dispatch({ type: 'SET_CONNECTION', status: 'connected' });
        clearInterval(checkId);
      }
    }, 100);

    const cleanups = [
      on<unknown>('connect', () => {
        const id = getId();
        if (id) dispatch({ type: 'SET_MY_ID', id });
        dispatch({ type: 'SET_CONNECTION', status: 'connected' });
        // If we have a stored session, ask the server to rebind us to it.
        const stored = readSession();
        if (stored) {
          playerTokenRef.current = stored.playerToken;
          pendingNameRef.current = stored.playerName;
          emit('rejoin_room', {
            roomCode: stored.roomCode,
            playerToken: stored.playerToken,
          });
        }
      }),
      on<unknown>('disconnect', () => {
        dispatch({ type: 'SET_CONNECTION', status: 'disconnected' });
      }),
      on<RoomState>('room_updated', (payload) => {
        dispatch({ type: 'ROOM_UPDATED', payload });
      }),
      on<{ roomCode: string; playerToken?: string }>('room_created', ({ roomCode, playerToken }) => {
        dispatch({ type: 'SET_ROOM_CODE', code: roomCode });
        if (playerToken) {
          playerTokenRef.current = playerToken;
          writeSession({ roomCode, playerToken, playerName: pendingNameRef.current });
        }
      }),
      on<{ roomCode: string; playerToken?: string }>('room_joined', ({ roomCode, playerToken }) => {
        dispatch({ type: 'SET_ROOM_CODE', code: roomCode });
        if (playerToken) {
          playerTokenRef.current = playerToken;
          writeSession({ roomCode, playerToken, playerName: pendingNameRef.current });
        }
      }),
      on<{ message: string }>('rejoin_failed', () => {
        // Stale session — drop it so we don't keep retrying.
        clearSession();
        playerTokenRef.current = null;
      }),
      on<Omit<RoundState, 'revealed'>>('game_started', (payload) => {
        dispatch({ type: 'GAME_STARTED', payload });
        addToast('info', `Round ${payload.roundNumber} — Guessing starts!`);
      }),
      on<{ allRevealed: RevealedAnswer[]; scores: Record<string, number>; players: Player[] }>(
        'answer_revealed',
        ({ allRevealed, scores, players }) => {
          dispatch({ type: 'ANSWER_REVEALED', revealed: allRevealed, scores, players });
        }
      ),
      on<{ scores: Record<string, number>; players: Player[] }>(
        'leaderboard_update',
        ({ scores, players }) => {
          dispatch({ type: 'LEADERBOARD_UPDATE', scores, players });
        }
      ),
      on<{ secondsRemaining: number }>('timer_update', ({ secondsRemaining }) => {
        dispatch({ type: 'TIMER_UPDATE', seconds: secondsRemaining });
      }),
      on<RoundEndState>('round_end', (payload) => {
        dispatch({ type: 'ROUND_END', payload });
        // ELO toast for the authed viewer, if their handle is in the deltas.
        const myHandle = userHandleRef.current;
        if (myHandle) {
          const mine = payload.eloChanges?.find((c) => c.handle === myHandle);
          if (mine && mine.delta !== 0) {
            const sign = mine.delta > 0 ? '+' : '';
            addToast(
              mine.delta > 0 ? 'success' : 'error',
              `ELO ${sign}${mine.delta} → ${mine.newElo}`,
            );
          }
        }
      }),
      on<GameEndState>('game_end', (payload) => {
        dispatch({ type: 'GAME_END', payload });
      }),
      on<GuessResult>('guess_result', (result) => {
        if (result.success) {
          addToast('success', `#${result.rank} — +${result.points} pts!`, result.points);
        } else {
          addToast('error', result.message);
        }
      }),
      on<{ message: string }>('error', ({ message }) => {
        addToast('error', message);
      }),
      on<ChatMessage>('chat_message', (message) => {
        dispatch({ type: 'ADD_CHAT_MESSAGE', message });
      }),
    ];

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      clearInterval(checkId);
    };
  }, [on, getId, addToast, emit]);

  const createRoom = useCallback((playerName: string, totalRounds?: number, timerSeconds?: number, customPrompts?: string[]) => {
    pendingNameRef.current = playerName;
    emit('create_room', { playerName, totalRounds, timerSeconds, customPrompts });
  }, [emit]);

  const joinRoom = useCallback((roomCode: string, playerName: string) => {
    pendingNameRef.current = playerName;
    emit('join_room', { roomCode: roomCode.toUpperCase(), playerName });
  }, [emit]);

  const leaveRoom = useCallback(() => {
    if (state.roomCode) {
      emit('leave_room', { roomCode: state.roomCode });
    }
    clearSession();
    playerTokenRef.current = null;
    pendingNameRef.current = '';
    dispatch({ type: 'RESET_ALL' });
  }, [emit, state.roomCode]);

  const startGame = useCallback(() => {
    if (!state.roomCode) return;
    emit('start_game', { roomCode: state.roomCode });
  }, [emit, state.roomCode]);

  const submitGuess = useCallback((guess: string) => {
    if (!state.roomCode) return;
    emit('submit_guess', { roomCode: state.roomCode, guess });
  }, [emit, state.roomCode]);

  const nextRound = useCallback(() => {
    if (!state.roomCode) return;
    emit('next_round', { roomCode: state.roomCode });
  }, [emit, state.roomCode]);

  const playAgain = useCallback(() => {
    if (!state.roomCode) return;
    emit('play_again', { roomCode: state.roomCode });
    dispatch({ type: 'RESET' });
  }, [emit, state.roomCode]);

  const isHost = Boolean(state.myId && state.roomState?.hostId === state.myId);

  const contextValue: RoomContextType = {
    ...state,
    isHost,
    createRoom,
    joinRoom,
    startGame,
    submitGuess,
    nextRound,
    playAgain,
    leaveRoom,
    addToast,
  };

  return (
    <RoomContext.Provider value={contextValue}>
      {children}
    </RoomContext.Provider>
  );
}
