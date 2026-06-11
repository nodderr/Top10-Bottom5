'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '@/hooks/useSocket';
import {
  GameState, Player, RoomState, RoundState,
  RevealedAnswer, RankedAnswer, GameEndState, RoundEndState, GuessResult, ToastMessage,
} from '@/types/game';

interface RoomStoreState {
  myId: string | null;
  roomCode: string | null;
  roomState: RoomState | null;
  roundState: RoundState | null;
  roundEndState: RoundEndState | null;
  gameEndState: GameEndState | null;
  gameState: GameState;
  toasts: ToastMessage[];
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
}

type Action =
  | { type: 'SET_MY_ID'; id: string }
  | { type: 'SET_ROOM_CODE'; code: string }
  | { type: 'ROOM_UPDATED'; payload: RoomState }
  | { type: 'GAME_STARTED'; payload: Omit<RoundState, 'revealed'> }
  | { type: 'ANSWER_REVEALED'; revealed: RevealedAnswer[] }
  | { type: 'TIMER_UPDATE'; seconds: number }
  | { type: 'ROUND_END'; payload: RoundEndState }
  | { type: 'GAME_END'; payload: GameEndState }
  | { type: 'ADD_TOAST'; toast: ToastMessage }
  | { type: 'REMOVE_TOAST'; id: string }
  | { type: 'SET_CONNECTION'; status: 'connecting' | 'connected' | 'disconnected' }
  | { type: 'RESET' };

const initialState: RoomStoreState = {
  myId: null,
  roomCode: null,
  roomState: null,
  roundState: null,
  roundEndState: null,
  gameEndState: null,
  gameState: 'waiting',
  toasts: [],
  connectionStatus: 'connecting',
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
        roundState: state.roundState
          ? { ...state.roundState, revealed: action.revealed }
          : state.roundState,
      };
    case 'TIMER_UPDATE':
      return {
        ...state,
        roundState: state.roundState
          ? { ...state.roundState, timerSeconds: action.seconds }
          : state.roundState,
      };
    case 'ROUND_END':
      return {
        ...state,
        gameState: action.payload.isLastRound ? 'game_end' : 'round_end',
        roundEndState: action.payload,
        roundState: state.roundState
          ? { ...state.roundState, allAnswers: action.payload.allAnswers }
          : state.roundState,
      };
    case 'GAME_END':
      return { ...state, gameState: 'game_end', gameEndState: action.payload };
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts.slice(-4), action.toast] };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };
    case 'SET_CONNECTION':
      return { ...state, connectionStatus: action.status };
    case 'RESET':
      return { ...initialState, myId: state.myId, connectionStatus: state.connectionStatus };
    default:
      return state;
  }
}

interface RoomContextType extends RoomStoreState {
  isHost: boolean;
  createRoom: (playerName: string, totalRounds?: number) => void;
  joinRoom: (roomCode: string, playerName: string) => void;
  startGame: () => void;
  submitGuess: (guess: string) => void;
  nextRound: () => void;
  playAgain: () => void;
  addToast: (type: ToastMessage['type'], message: string, points?: number) => void;
}

export const RoomContext = createContext<RoomContextType | null>(null);

let toastCounter = 0;

export function RoomProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { emit, on, getId } = useSocket();
  const initialized = useRef(false);

  const addToast = useCallback((type: ToastMessage['type'], message: string, points?: number) => {
    const id = String(++toastCounter);
    const toast: ToastMessage = { id, type, message, points };
    dispatch({ type: 'ADD_TOAST', toast });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', id }), 3500);
  }, []);

  useEffect(() => {
    // Set my socket ID
    const checkId = setInterval(() => {
      const id = getId();
      if (id) {
        dispatch({ type: 'SET_MY_ID', id });
        dispatch({ type: 'SET_CONNECTION', status: 'connected' });
        clearInterval(checkId);
      }
    }, 100);

    const cleanups = [
      on<RoomState>('room_updated', (payload) => {
        dispatch({ type: 'ROOM_UPDATED', payload });
      }),
      on<{ roomCode: string }>('room_created', ({ roomCode }) => {
        dispatch({ type: 'SET_ROOM_CODE', code: roomCode });
      }),
      on<{ roomCode: string }>('room_joined', ({ roomCode }) => {
        dispatch({ type: 'SET_ROOM_CODE', code: roomCode });
      }),
      on<Omit<RoundState, 'revealed'>>('game_started', (payload) => {
        dispatch({ type: 'GAME_STARTED', payload });
        addToast('info', `Round ${payload.roundNumber} — Guessing starts!`);
      }),
      on<{ allRevealed: RevealedAnswer[]; scores: Record<string, number>; players: Player[] }>(
        'answer_revealed',
        ({ allRevealed }) => {
          dispatch({ type: 'ANSWER_REVEALED', revealed: allRevealed });
        }
      ),
      on<{ secondsRemaining: number }>('timer_update', ({ secondsRemaining }) => {
        dispatch({ type: 'TIMER_UPDATE', seconds: secondsRemaining });
      }),
      on<RoundEndState>('round_end', (payload) => {
        dispatch({ type: 'ROUND_END', payload });
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
    ];

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      clearInterval(checkId);
    };
  }, [on, getId, addToast]);

  const createRoom = useCallback((playerName: string, totalRounds?: number) => {
    emit('create_room', { playerName, totalRounds });
  }, [emit]);

  const joinRoom = useCallback((roomCode: string, playerName: string) => {
    emit('join_room', { roomCode: roomCode.toUpperCase(), playerName });
  }, [emit]);

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
    addToast,
  };

  return (
    <RoomContext.Provider value={contextValue}>
      {children}
    </RoomContext.Provider>
  );
}
