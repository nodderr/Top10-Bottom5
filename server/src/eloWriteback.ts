// ============================================================
// ELO + game-history writeback.
//
// Lifecycle:
//   ensureGameRecord(room)     → insert into public.games at start of round 1
//   applyRoundElo(room, ...)   → at end of each round, compute deltas for
//                                authed players, write round_results rows,
//                                update elo_ratings, return per-player deltas
//                                so the socket layer can ship them to clients
//   finalizeGame(gameId)       → at game_end, set games.ended_at + bump
//                                games_played for each authed participant
// ============================================================

import { pool } from './db';
import { Player, Room } from './types';
import {
  BASE_ELO,
  EloChangeResult,
  PlayerPerformance,
  calculateMultiplayerElo,
} from './elo';

/** Insert a public.games row if the room doesn't have one yet. */
export async function ensureGameRecord(room: Room): Promise<string | null> {
  if (room.gameId) return room.gameId;
  try {
    const { rows } = await pool.query<{ id: string }>(
      `insert into public.games (room_code, total_rounds, player_count)
       values ($1, $2, $3)
       returning id`,
      [room.code, room.totalRounds, room.players.length],
    );
    room.gameId = rows[0].id;
    return room.gameId;
  } catch (err) {
    console.error('[ELO] ensureGameRecord failed:', err);
    return null;
  }
}

export interface RoundEloDelta {
  userId: string;
  handle: string;
  oldElo: number;
  newElo: number;
  delta: number;
}

/**
 * At round end, computes ELO changes for authed players and persists them.
 * Returns one entry per authed player so the socket layer can include the
 * deltas in the round_end payload.
 */
export async function applyRoundElo(
  room: Room,
  roundNumber: number,
  roundScores: Record<string, number>,
): Promise<RoundEloDelta[]> {
  const gameId = await ensureGameRecord(room);
  if (!gameId) return [];

  const authedPlayers = room.players.filter(
    (p): p is Player & { userId: string; handle: string } =>
      typeof p.userId === 'string',
  );

  // Look up current ratings for each authed player.
  const ratingMap = new Map<string, number>();
  if (authedPlayers.length > 0) {
    const userIds = authedPlayers.map((p) => p.userId);
    const { rows } = await pool.query<{ user_id: string; rating: number }>(
      `select user_id, rating
         from public.elo_ratings
        where user_id = any($1::uuid[])`,
      [userIds],
    );
    for (const r of rows) ratingMap.set(r.user_id, r.rating);
    // Seed any authed user missing an elo_ratings row at the base rating
    // (registration normally inserts one; this is a safety net).
    for (const p of authedPlayers) {
      if (!ratingMap.has(p.userId)) {
        await pool.query(
          `insert into public.elo_ratings (user_id) values ($1)
           on conflict (user_id) do nothing`,
          [p.userId],
        );
        ratingMap.set(p.userId, BASE_ELO);
      }
    }
  }

  // Run ELO only when ≥2 authed players are in the room. Otherwise nothing
  // moves (matches the spec's N<2 short-circuit and avoids meaningless deltas
  // when a registered user plays alone with guests).
  const eloInputs: PlayerPerformance[] = authedPlayers.map((p) => ({
    id: p.userId,
    preGameElo: ratingMap.get(p.userId) ?? BASE_ELO,
    finalScore: roundScores[p.id] ?? 0,
  }));

  const eloResults: EloChangeResult[] =
    eloInputs.length >= 2
      ? calculateMultiplayerElo(eloInputs)
      : eloInputs.map((p) => ({ id: p.id, oldElo: p.preGameElo, newElo: p.preGameElo, delta: 0 }));

  // Persist: round_results for every player in the room (authed or guest),
  // elo_ratings update for authed players only.
  const client = await pool.connect();
  const eloByUserId = new Map(eloResults.map((r) => [r.id, r]));
  try {
    await client.query('begin');

    // Rank within the round (1 = highest score; ties get the same rank).
    const ordered = [...room.players]
      .map((p) => ({ p, score: roundScores[p.id] ?? 0 }))
      .sort((a, b) => b.score - a.score);
    let lastScore = Number.POSITIVE_INFINITY;
    let lastRank = 0;
    const rankMap = new Map<string, number>();
    ordered.forEach((entry, idx) => {
      const rank = entry.score === lastScore ? lastRank : idx + 1;
      rankMap.set(entry.p.id, rank);
      lastScore = entry.score;
      lastRank = rank;
    });

    for (const p of room.players) {
      const score = roundScores[p.id] ?? 0;
      const rank = rankMap.get(p.id) ?? 0;
      const elo = p.userId ? eloByUserId.get(p.userId) : undefined;
      await client.query(
        `insert into public.round_results
           (game_id, round_number, user_id, guest_label, score, rank,
            rating_before, rating_after, rating_delta)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          gameId,
          roundNumber,
          p.userId ?? null,
          p.userId ? null : p.name,
          score,
          rank,
          elo?.oldElo ?? null,
          elo?.newElo ?? null,
          elo?.delta ?? null,
        ],
      );
    }

    for (const r of eloResults) {
      await client.query(
        `update public.elo_ratings
            set rating         = $2,
                peak_rating    = greatest(peak_rating, $2),
                rounds_played  = rounds_played + 1,
                last_played    = now(),
                updated_at     = now()
          where user_id = $1`,
        [r.id, r.newElo],
      );
    }

    await client.query('commit');
  } catch (err) {
    await client.query('rollback');
    console.error('[ELO] applyRoundElo failed:', err);
    return [];
  } finally {
    client.release();
  }

  return authedPlayers.map((p) => {
    const r = eloByUserId.get(p.userId)!;
    return {
      userId: p.userId,
      handle: p.handle,
      oldElo: r.oldElo,
      newElo: r.newElo,
      delta: r.delta,
    };
  });
}

/** At game end, mark the games row finalised + bump games_played counters. */
export async function finalizeGame(room: Room): Promise<void> {
  if (!room.gameId) return;
  const authedUserIds = room.players
    .map((p) => p.userId)
    .filter((id): id is string => typeof id === 'string');
  try {
    await pool.query(
      `update public.games
          set ended_at = now()
        where id = $1`,
      [room.gameId],
    );
    if (authedUserIds.length > 0) {
      await pool.query(
        `update public.elo_ratings
            set games_played = games_played + 1
          where user_id = any($1::uuid[])`,
        [authedUserIds],
      );
    }
  } catch (err) {
    console.error('[ELO] finalizeGame failed:', err);
  }
}
