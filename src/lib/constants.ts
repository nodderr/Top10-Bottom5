export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001';

export const POINTS_BY_RANK: Record<number, number> = {
  1: 10, 2: 9, 3: 8, 4: 7, 5: 6,
  6: 5,  7: 4, 8: 3, 9: 2, 10: 1,
};

export const ROUND_TIMER_SECONDS = 90;
export const TOTAL_ANSWERS = 10;
export const DEFAULT_TOTAL_ROUNDS = 3;
export const MAX_PLAYERS = 12;
export const MAX_NAME_LENGTH = 24;
