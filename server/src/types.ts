// ============================================================
// Shared types for server-side game logic
// ============================================================

export type GameState = 'waiting' | 'generating' | 'playing' | 'round_end' | 'game_end';

export interface Player {
  id: string;          // CURRENT socket id (rebound on rejoin)
  token: string;       // stable identity across reconnects, stored client-side
  name: string;
  score: number;
  roundScore: number;
  isHost: boolean;
  isReady: boolean;
  disconnected: boolean;        // true between socket-disconnect and either rejoin or grace expiry
  disconnectedAt?: number;
  joinedAt: number;
}

export interface RankedAnswer {
  rank: number;
  answer: string;
  normalizedAnswer: string; // pre-normalized for matching
}

export interface RevealedAnswer {
  rank: number;
  answer: string;
  foundBy: string;   // player name
  foundById: string; // player socket id
  points: number;
}

export interface RoundData {
  roundNumber: number;
  category: string;
  answers: RankedAnswer[];        // full list — server only, never sent to clients
  revealed: RevealedAnswer[];     // found answers
  startedAt: number;
  timerSeconds: number;
  timerInterval?: ReturnType<typeof setInterval>;
}

export interface Room {
  code: string;
  hostId: string;
  players: Player[];
  scores: Record<string, number>;   // playerId -> cumulative score
  state: GameState;
  totalRounds: number;
  currentRound: number;
  timerSeconds: number;             // per-round guess timer (host-configurable)
  customPrompts?: string[];
  roundData?: RoundData;
  createdAt: number;
  lastActivityAt: number;
}

// ---- Socket event payloads (client → server) ----

export interface CreateRoomPayload {
  playerName: string;
  totalRounds?: number;
  timerSeconds?: number;
  customPrompts?: string[];
}

export interface JoinRoomPayload {
  roomCode: string;
  playerName: string;
}

export interface RejoinRoomPayload {
  roomCode: string;
  playerToken: string;
}

export interface LeaveRoomPayload {
  roomCode: string;
}

export interface SubmitGuessPayload {
  roomCode: string;
  guess: string;
}

export interface StartGamePayload {
  roomCode: string;
}

export interface NextRoundPayload {
  roomCode: string;
}

// ---- Socket event payloads (server → client) ----

export interface RoomStatePayload {
  code: string;
  state: GameState;
  players: Player[];
  totalRounds: number;
  currentRound: number;
  timerSeconds: number;
  hostId: string;
}

export interface GameStartedPayload {
  category: string;
  totalAnswers: number;
  roundNumber: number;
  totalRounds: number;
  timerSeconds: number;
}

export interface AnswerRevealedPayload {
  revealed: RevealedAnswer;
  allRevealed: RevealedAnswer[];
  scores: Record<string, number>;
  players: Player[];
}

export interface TimerUpdatePayload {
  secondsRemaining: number;
}

export interface RoundEndPayload {
  allAnswers: RankedAnswer[];
  revealed: RevealedAnswer[];
  scores: Record<string, number>;
  players: Player[];
  roundWinnerId: string | null;
  roundWinnerName: string | null;
  roundNumber: number;
  isLastRound: boolean;
}

export interface GameEndPayload {
  scores: Record<string, number>;
  players: Player[];
  winnerId: string | null;
  winnerName: string | null;
}

export interface GuessResultPayload {
  success: boolean;
  message: string;
  points?: number;
  rank?: number;
}

export interface ErrorPayload {
  message: string;
}

// ---- AI Provider types ----

export interface AIRankingResult {
  category: string;
  answers: Array<{
    rank: number;
    answer: string;
  }>;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  type: 'correct' | 'incorrect' | 'system';
  timestamp: number;
}
