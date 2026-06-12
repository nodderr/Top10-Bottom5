export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001';

// Must match server/src/roomManager.ts pointsForRank — scaled ×1000 for game-feel.
export const POINTS_BY_RANK: Record<number, number> = {
  1: 10000, 2: 9000, 3: 8000, 4: 7000, 5: 6000,
  6:  5000, 7: 4000, 8: 3000, 9: 2000, 10: 1000,
};

export const ROUND_TIMER_SECONDS = 90;
export const TOTAL_ANSWERS = 10;
export const DEFAULT_TOTAL_ROUNDS = 3;
export const MAX_PLAYERS = 12;
export const MAX_NAME_LENGTH = 24;
