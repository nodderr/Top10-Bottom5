// ============================================================
// Room Manager — in-memory room store
// No database. All state lives here for the server's lifetime.
// ============================================================

import { Room, Player, GameState, RoundData, RankedAnswer } from './types';
import { normalize } from './fuzzyMatcher';

const rooms = new Map<string, Room>();

// ---- Room code generation ----

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I, O, 0, 1 (ambiguous)

function generateCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

function generateUniqueCode(): string {
  let code = generateCode();
  let attempts = 0;
  while (rooms.has(code) && attempts < 100) {
    code = generateCode();
    attempts++;
  }
  return code;
}

// ---- Scoring ----
// Scaled ×1000 for game-feel ("you scored 10,000!"). All clients display raw
// server values — no cosmetic multiplication anywhere on the frontend.
export const POINTS_SCALE = 1000;

export function pointsForRank(rank: number): number {
  return Math.max(0, 11 - rank) * POINTS_SCALE; // rank 1 = 10000, rank 10 = 1000
}

// ---- CRUD ----

export function createRoom(
  hostId: string,
  hostName: string,
  totalRounds = 3,
  timerSeconds = 90,
  customPrompts?: string[]
): Room {
  const code = generateUniqueCode();
  const host: Player = {
    id: hostId,
    name: hostName,
    score: 0,
    roundScore: 0,
    isHost: true,
    isReady: true,
    joinedAt: Date.now(),
  };

  const room: Room = {
    code,
    hostId,
    players: [host],
    scores: { [hostId]: 0 },
    state: 'waiting',
    totalRounds,
    currentRound: 0,
    timerSeconds,
    customPrompts,
    createdAt: Date.now(),
    lastActivityAt: Date.now(),
  };

  rooms.set(code, room);
  return room;
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code.toUpperCase());
}

const onDeleteHooks: Array<(code: string) => void> = [];

export function onRoomDeleted(hook: (code: string) => void): void {
  onDeleteHooks.push(hook);
}

export function deleteRoom(code: string): void {
  const upper = code.toUpperCase();
  const existed = rooms.delete(upper);
  if (existed) {
    for (const hook of onDeleteHooks) {
      try { hook(upper); } catch (e) { console.error('[Room] delete hook failed:', e); }
    }
  }
}

export function addPlayer(code: string, playerId: string, playerName: string): Room | null {
  const room = getRoom(code);
  if (!room) return null;

  // Prevent duplicate socket IDs
  if (room.players.find((p) => p.id === playerId)) return room;

  // Trim and sanitize name
  const name = playerName.trim().slice(0, 24) || 'Player';

  const player: Player = {
    id: playerId,
    name,
    score: 0,
    roundScore: 0,
    isHost: false,
    isReady: false,
    joinedAt: Date.now(),
  };

  room.players.push(player);
  room.scores[playerId] = 0;
  room.lastActivityAt = Date.now();
  return room;
}

export function removePlayer(code: string, playerId: string): Room | null {
  const room = getRoom(code);
  if (!room) return null;

  room.players = room.players.filter((p) => p.id !== playerId);
  delete room.scores[playerId];
  room.lastActivityAt = Date.now();

  // If host left, assign new host
  if (room.hostId === playerId && room.players.length > 0) {
    room.hostId = room.players[0].id;
    room.players[0].isHost = true;
  }

  return room;
}

export function setState(code: string, state: GameState): void {
  const room = getRoom(code);
  if (room) {
    room.state = state;
    room.lastActivityAt = Date.now();
  }
}

export function setRoundData(
  code: string,
  roundNumber: number,
  category: string,
  answers: Array<{ rank: number; answer: string; normalizedAnswer?: string }>
): void {
  const room = getRoom(code);
  if (!room) return;

  // Reset round scores
  room.players.forEach((p) => (p.roundScore = 0));

  const rankedAnswers: RankedAnswer[] = answers.map((a) => ({
    rank: a.rank,
    answer: a.answer,
    normalizedAnswer: a.normalizedAnswer ?? normalize(a.answer),
  }));

  room.roundData = {
    roundNumber,
    category,
    answers: rankedAnswers,
    revealed: [],
    startedAt: Date.now(),
    timerSeconds: room.timerSeconds,
  };

  room.currentRound = roundNumber;
  room.state = 'playing';
  room.lastActivityAt = Date.now();
}

export function recordReveal(
  code: string,
  rank: number,
  foundById: string,
  foundByName: string
): { points: number; allRevealed: Room['roundData'] } | null {
  const room = getRoom(code);
  if (!room?.roundData) return null;

  const points = pointsForRank(rank);

  // Update player scores
  const player = room.players.find((p) => p.id === foundById);
  if (player) {
    player.score += points;
    player.roundScore += points;
  }
  room.scores[foundById] = (room.scores[foundById] ?? 0) + points;

  room.roundData.revealed.push({
    rank,
    answer: room.roundData.answers.find((a) => a.rank === rank)?.answer ?? '',
    foundBy: foundByName,
    foundById,
    points,
  });

  room.lastActivityAt = Date.now();
  return { points, allRevealed: room.roundData };
}

export function getRevealedRanks(code: string): Set<number> {
  const room = getRoom(code);
  if (!room?.roundData) return new Set();
  return new Set(room.roundData.revealed.map((r) => r.rank));
}

export function isRoundComplete(code: string): boolean {
  const room = getRoom(code);
  if (!room?.roundData) return false;
  return room.roundData.revealed.length >= room.roundData.answers.length;
}

export function getRoundWinner(code: string): Player | null {
  const room = getRoom(code);
  if (!room?.roundData) return null;

  let winner: Player | null = null;
  let maxScore = 0;

  for (const player of room.players) {
    if (player.roundScore > maxScore) {
      maxScore = player.roundScore;
      winner = player;
    }
  }

  return maxScore > 0 ? winner : null;
}

export function getGameWinner(code: string): Player | null {
  const room = getRoom(code);
  if (!room) return null;

  let winner: Player | null = null;
  let maxScore = 0;

  for (const player of room.players) {
    if (player.score > maxScore) {
      maxScore = player.score;
      winner = player;
    }
  }

  return maxScore > 0 ? winner : null;
}

export function getAllRooms(): Map<string, Room> {
  return rooms;
}

// ---- Cleanup ----

const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;  // 10 minutes
const ROOM_MAX_AGE_MS     = 60 * 60 * 1000;  // 1 hour

export function startCleanup(): void {
  setInterval(() => {
    const now = Date.now();
    let cleaned = 0;

    for (const [code, room] of rooms.entries()) {
      if (now - room.lastActivityAt > ROOM_MAX_AGE_MS) {
        // Clear any running timer
        if (room.roundData?.timerInterval) {
          clearInterval(room.roundData.timerInterval);
        }
        deleteRoom(code); // fires onRoomDeleted hooks
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[Cleanup] Removed ${cleaned} inactive room(s). Active: ${rooms.size}`);
    }
  }, CLEANUP_INTERVAL_MS);

  console.log('[Cleanup] Room cleanup scheduler started (every 10 min, max age 1 hr)');
}
