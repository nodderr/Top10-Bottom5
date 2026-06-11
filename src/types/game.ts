// ============================================================
// Shared TypeScript types for the frontend
// ============================================================

export type GameState = 'waiting' | 'generating' | 'playing' | 'round_end' | 'game_end';

export interface Player {
  id: string;
  name: string;
  score: number;
  roundScore: number;
  isHost: boolean;
  isReady: boolean;
  joinedAt: number;
}

export interface RevealedAnswer {
  rank: number;
  answer: string;
  foundBy: string;
  foundById: string;
  points: number;
}

export interface RankedAnswer {
  rank: number;
  answer: string;
}

export interface RoomState {
  code: string;
  state: GameState;
  players: Player[];
  scores: Record<string, number>;
  totalRounds: number;
  currentRound: number;
  hostId: string;
}

export interface RoundState {
  category: string;
  totalAnswers: number;
  roundNumber: number;
  totalRounds: number;
  timerSeconds: number;
  revealed: RevealedAnswer[];
  allAnswers?: RankedAnswer[]; // populated at round end
}

export interface GameEndState {
  scores: Record<string, number>;
  players: Player[];
  winnerId: string | null;
  winnerName: string | null;
}

export interface RoundEndState {
  category?: string;
  allAnswers: RankedAnswer[];
  revealed: RevealedAnswer[];
  scores: Record<string, number>;
  players: Player[];
  roundWinnerId: string | null;
  roundWinnerName: string | null;
  roundNumber: number;
  totalRounds?: number;
  isLastRound: boolean;
}

export interface GuessResult {
  success: boolean;
  message: string;
  points?: number;
  rank?: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  points?: number;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  type: 'correct' | 'incorrect' | 'system';
  timestamp: number;
}
