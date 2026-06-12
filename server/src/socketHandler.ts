// ============================================================
// Socket.io event handler — the game's core logic
// ============================================================

import { Server, Socket } from 'socket.io';
import * as rm from './roomManager';
import { generateRanking, generateRankingForCustomPrompt } from './aiProvider';
import { findMatchingRank } from './fuzzyMatcher';
import { applyRoundElo, finalizeGame, RoundEloDelta } from './eloWriteback';
import {
  CreateRoomPayload,
  JoinRoomPayload,
  RejoinRoomPayload,
  LeaveRoomPayload,
  SubmitGuessPayload,
  StartGamePayload,
  NextRoundPayload,
  Room,
} from './types';

const DISCONNECT_GRACE_MS = 30_000;
interface PendingRemoval {
  timer: ReturnType<typeof setTimeout>;
  code: string;
}
const disconnectTimers = new Map<string, PendingRemoval>(); // keyed by player token
rm.onRoomDeleted((code) => {
  for (const [token, pending] of disconnectTimers.entries()) {
    if (pending.code === code) {
      clearTimeout(pending.timer);
      disconnectTimers.delete(token);
    }
  }
});

// Track which theme buckets each room has already used (for variety)
const roomUsedThemes = new Map<string, string[]>();
rm.onRoomDeleted((code) => roomUsedThemes.delete(code));

// Per-socket guess rate limiting: token bucket, ~5 guesses/sec
const GUESS_BUCKET_MAX = 8;
const GUESS_REFILL_PER_SEC = 5;
const guessBuckets = new Map<string, { tokens: number; lastRefill: number }>();

function takeGuessToken(socketId: string): boolean {
  const now = Date.now();
  const b = guessBuckets.get(socketId) ?? { tokens: GUESS_BUCKET_MAX, lastRefill: now };
  const elapsed = (now - b.lastRefill) / 1000;
  b.tokens = Math.min(GUESS_BUCKET_MAX, b.tokens + elapsed * GUESS_REFILL_PER_SEC);
  b.lastRefill = now;
  if (b.tokens < 1) {
    guessBuckets.set(socketId, b);
    return false;
  }
  b.tokens -= 1;
  guessBuckets.set(socketId, b);
  return true;
}

// Per-socket create_room throttle: 1 per 10s
const createRoomLastAt = new Map<string, number>();
function canCreateRoom(socketId: string): boolean {
  const last = createRoomLastAt.get(socketId) ?? 0;
  const now = Date.now();
  if (now - last < 10_000) return false;
  createRoomLastAt.set(socketId, now);
  return true;
}

function buildRoomState(room: Room) {
  return {
    code: room.code,
    state: room.state,
    players: room.players,
    scores: room.scores,
    totalRounds: room.totalRounds,
    currentRound: room.currentRound,
    timerSeconds: room.timerSeconds,
    hostId: room.hostId,
  };
}

// Host can pick a per-round timer — clamp defensively in case a non-frontend
// client tries something silly. Range is generous around our presets.
const TIMER_MIN_SECONDS = 15;
const TIMER_MAX_SECONDS = 240;
function clampTimer(seconds: number | undefined): number {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return 90;
  return Math.min(Math.max(Math.round(seconds), TIMER_MIN_SECONDS), TIMER_MAX_SECONDS);
}

function startTimer(io: Server, room: Room): void {
  if (!room.roundData) return;

  // Clear any existing timer
  if (room.roundData.timerInterval) {
    clearInterval(room.roundData.timerInterval);
  }

  room.roundData.timerInterval = setInterval(() => {
    if (!room.roundData) return;

    room.roundData.timerSeconds--;

    io.to(room.code).emit('timer_update', {
      secondsRemaining: room.roundData.timerSeconds,
    });

    if (room.roundData.timerSeconds <= 0) {
      clearInterval(room.roundData.timerInterval);
      void endRound(io, room).catch((err) => console.error('[Timer] endRound failed:', err));
    }
  }, 1000);
}

async function endRound(io: Server, room: Room): Promise<void> {
  if (!room.roundData) return;

  // Stop timer
  if (room.roundData.timerInterval) {
    clearInterval(room.roundData.timerInterval);
    room.roundData.timerInterval = undefined;
  }

  const isLastRound = room.currentRound >= room.totalRounds;
  const roundWinner = rm.getRoundWinner(room.code);

  room.state = isLastRound ? 'game_end' : 'round_end';
  room.lastActivityAt = Date.now();

  // Snapshot per-round scores (players[i].roundScore) for ELO. We use
  // round-scoped scores, not cumulative — ELO is per-round per the spec.
  const roundScores: Record<string, number> = {};
  for (const p of room.players) roundScores[p.id] = p.roundScore ?? 0;

  console.log('[DEBUG endRound] players:', room.players.map(p => ({ name: p.name, userId: p.userId, handle: p.handle, roundScore: p.roundScore })));
  let eloChanges: RoundEloDelta[] = [];
  try {
    eloChanges = await applyRoundElo(room, room.currentRound, roundScores);
  } catch (err) {
    console.error('[endRound] applyRoundElo threw:', err);
  }
  console.log('[DEBUG endRound] eloChanges:', eloChanges);

  const payload = {
    category: room.roundData.category,
    allAnswers: room.roundData.answers,
    revealed: room.roundData.revealed,
    scores: room.scores,
    players: room.players,
    roundWinnerId: roundWinner?.id ?? null,
    roundWinnerName: roundWinner?.name ?? null,
    roundNumber: room.currentRound,
    isLastRound,
    eloChanges,
  };

  io.to(room.code).emit('round_end', payload);
  io.to(room.code).emit('room_updated', buildRoomState(room));

  if (isLastRound) {
    const gameWinner = rm.getGameWinner(room.code);
    io.to(room.code).emit('game_end', {
      scores: room.scores,
      players: room.players,
      winnerId: gameWinner?.id ?? null,
      winnerName: gameWinner?.name ?? null,
    });
    try {
      await finalizeGame(room);
    } catch (err) {
      console.error('[endRound] finalizeGame threw:', err);
    }
  }
}

async function startNewRound(io: Server, room: Room): Promise<void> {
  const roomCode = room.code;
  room.state = 'generating';
  room.lastActivityAt = Date.now();

  io.to(roomCode).emit('room_updated', buildRoomState(room));

  try {
    const nextRoundIndex = room.currentRound; // 0 for Round 1, 1 for Round 2, etc.
    let ranking;

    if (room.customPrompts && room.customPrompts[nextRoundIndex] && room.customPrompts[nextRoundIndex].trim()) {
      const customPrompt = room.customPrompts[nextRoundIndex].trim();
      ranking = await generateRankingForCustomPrompt(customPrompt);
    } else {
      // Generate — AI freely picks the topic within a random theme bucket
      const usedThemes = roomUsedThemes.get(roomCode) ?? [];
      ranking = await generateRanking(usedThemes);

      // Track used theme for variety
      usedThemes.push(ranking.theme);
      roomUsedThemes.set(roomCode, usedThemes);
    }

    const roundNumber = room.currentRound + 1;
    rm.setRoundData(roomCode, roundNumber, ranking.category, ranking.answers);

    const updatedRoom = rm.getRoom(roomCode);
    if (!updatedRoom?.roundData) return;

    io.to(roomCode).emit('game_started', {
      category: ranking.category,
      totalAnswers: 10,
      roundNumber,
      totalRounds: room.totalRounds,
      timerSeconds: room.timerSeconds,
    });

    io.to(roomCode).emit('room_updated', buildRoomState(updatedRoom));

    startTimer(io, updatedRoom);
  } catch (err) {
    console.error('[startNewRound] AI generation failed:', err);
    room.state = 'waiting';
    io.to(roomCode).emit('error', { message: 'Failed to generate round. Please try again.' });
    io.to(roomCode).emit('room_updated', buildRoomState(room));
  }
}

export function registerHandlers(io: Server, socket: Socket): void {
  // ---- create_room ----
  socket.on('create_room', (payload: CreateRoomPayload) => {
    try {
      const name = (payload.playerName ?? '').trim().slice(0, 24);
      if (!name) {
        socket.emit('error', { message: 'Please enter a display name.' });
        return;
      }

      if (!canCreateRoom(socket.id)) {
        socket.emit('error', { message: 'Please wait a few seconds before creating another room.' });
        return;
      }

      const totalRounds = Math.min(Math.max(payload.totalRounds ?? 3, 1), 10);
      const timerSeconds = clampTimer(payload.timerSeconds);
      // Trim + cap custom prompts to mitigate prompt-injection. Empty entries are kept
      // (they trigger the random-AI fallback for that round, which is the documented behavior).
      const sanitizedPrompts = Array.isArray(payload.customPrompts)
        ? payload.customPrompts.slice(0, totalRounds).map((p) =>
            typeof p === 'string' ? p.replace(/[\r\n]+/g, ' ').trim().slice(0, 120) : ''
          )
        : undefined;
      const identity = socket.data.authedUser
        ? { userId: socket.data.authedUser.userId, handle: socket.data.authedUser.handle }
        : undefined;
      const room = rm.createRoom(
        socket.id,
        name,
        totalRounds,
        timerSeconds,
        sanitizedPrompts,
        identity,
      );

      socket.join(room.code);
      const hostPlayer = room.players[0];
      socket.emit('room_created', { roomCode: room.code, playerToken: hostPlayer.token });
      socket.emit('room_updated', buildRoomState(room));

      console.log(`[Room] Created ${room.code} by ${name}`);
    } catch {
      socket.emit('error', { message: 'Failed to create room.' });
    }
  });

  // ---- join_room ----
  socket.on('join_room', (payload: JoinRoomPayload) => {
    try {
      const code = (payload.roomCode ?? '').trim().toUpperCase();
      const name = (payload.playerName ?? '').trim().slice(0, 24);

      if (!code || !name) {
        socket.emit('error', { message: 'Room code and name are required.' });
        return;
      }

      const room = rm.getRoom(code);
      if (!room) {
        socket.emit('error', { message: 'Room not found. Check the code and try again.' });
        return;
      }
      if (room.players.length >= 12) {
        socket.emit('error', { message: 'Room is full (max 12 players).' });
        return;
      }

      const identity = socket.data.authedUser
        ? { userId: socket.data.authedUser.userId, handle: socket.data.authedUser.handle }
        : undefined;
      const updatedRoom = rm.addPlayer(code, socket.id, name, identity);
      if (!updatedRoom) {
        socket.emit('error', { message: 'Could not join room.' });
        return;
      }

      socket.join(code);
      const newPlayer = updatedRoom.players.find((p) => p.id === socket.id);
      socket.emit('room_joined', { roomCode: code, playerToken: newPlayer?.token ?? '' });

      io.to(code).emit('player_joined', { player: newPlayer, roomState: buildRoomState(updatedRoom) });
      io.to(code).emit('room_updated', buildRoomState(updatedRoom));

      // Mid-game join — replay the events the joiner missed so they land in the
      // correct screen with full context. Everyone already in the room ignores these
      // because they're emitted to the joiner's socket only.
      if (updatedRoom.state !== 'waiting' && updatedRoom.roundData) {
        const rd = updatedRoom.roundData;
        if (updatedRoom.state === 'playing' || updatedRoom.state === 'generating') {
          socket.emit('game_started', {
            category: rd.category,
            totalAnswers: 10,
            roundNumber: rd.roundNumber,
            totalRounds: updatedRoom.totalRounds,
            timerSeconds: rd.timerSeconds,
          });
          if (rd.revealed.length > 0) {
            socket.emit('answer_revealed', {
              revealed: rd.revealed[rd.revealed.length - 1],
              allRevealed: rd.revealed,
              scores: updatedRoom.scores,
              players: updatedRoom.players,
            });
          }
        } else if (updatedRoom.state === 'round_end' || updatedRoom.state === 'game_end') {
          const roundWinner = rm.getRoundWinner(code);
          const isLastRound = updatedRoom.currentRound >= updatedRoom.totalRounds;
          socket.emit('round_end', {
            category: rd.category,
            allAnswers: rd.answers,
            revealed: rd.revealed,
            scores: updatedRoom.scores,
            players: updatedRoom.players,
            roundWinnerId: roundWinner?.id ?? null,
            roundWinnerName: roundWinner?.name ?? null,
            roundNumber: updatedRoom.currentRound,
            isLastRound,
          });
          if (updatedRoom.state === 'game_end') {
            const gameWinner = rm.getGameWinner(code);
            socket.emit('game_end', {
              scores: updatedRoom.scores,
              players: updatedRoom.players,
              winnerId: gameWinner?.id ?? null,
              winnerName: gameWinner?.name ?? null,
            });
          }
        }
      }

      const joinedWhere = updatedRoom.state === 'waiting' ? 'the lobby' : 'mid-game';
      io.to(code).emit('chat_message', {
        id: Math.random().toString(36).substring(2, 9),
        sender: 'System',
        text: `${name} joined ${joinedWhere}`,
        type: 'system',
        timestamp: Date.now(),
      });

      console.log(`[Room] ${name} joined ${code} (state=${updatedRoom.state})`);
    } catch {
      socket.emit('error', { message: 'Failed to join room.' });
    }
  });

  // ---- start_game ----
  socket.on('start_game', async (payload: StartGamePayload) => {
    try {
      const code = (payload.roomCode ?? '').trim().toUpperCase();
      const room = rm.getRoom(code);

      if (!room) { socket.emit('error', { message: 'Room not found.' }); return; }
      if (room.hostId !== socket.id) { socket.emit('error', { message: 'Only the host can start the game.' }); return; }
      if (room.state !== 'waiting') { socket.emit('error', { message: 'Game already started.' }); return; }
      if (room.players.length < 1) { socket.emit('error', { message: 'Need at least 1 player to start.' }); return; }

      roomUsedThemes.set(code, []); // reset theme tracking
      await startNewRound(io, room);
    } catch {
      socket.emit('error', { message: 'Failed to start game.' });
    }
  });

  // ---- submit_guess ----
  socket.on('submit_guess', (payload: SubmitGuessPayload) => {
    try {
      const code = (payload.roomCode ?? '').trim().toUpperCase();
      const guess = (payload.guess ?? '').trim().slice(0, 80);
      const room = rm.getRoom(code);

      if (!room) { socket.emit('guess_result', { success: false, message: 'Room not found.' }); return; }
      if (room.state !== 'playing') { socket.emit('guess_result', { success: false, message: 'Round is not active.' }); return; }
      if (!room.roundData) { socket.emit('guess_result', { success: false, message: 'No active round.' }); return; }
      if (!guess) { socket.emit('guess_result', { success: false, message: 'Please enter a guess.' }); return; }
      if (rm.isRoundComplete(code)) { socket.emit('guess_result', { success: false, message: 'Round is over.' }); return; }
      if (!takeGuessToken(socket.id)) { socket.emit('guess_result', { success: false, message: 'Slow down a bit!' }); return; }

      const alreadyFound = rm.getRevealedRanks(code);
      const matchedRank = findMatchingRank(guess, room.roundData.answers, alreadyFound);

      const player = room.players.find((p) => p.id === socket.id);
      const playerName = player?.name ?? 'Unknown';

      if (matchedRank === null) {
        socket.emit('guess_result', { success: false, message: 'Not on the list!' });
        io.to(code).emit('chat_message', {
          id: Math.random().toString(36).substring(2, 9),
          sender: playerName,
          text: guess,
          type: 'incorrect',
          timestamp: Date.now(),
        });
        return;
      }

      const result = rm.recordReveal(code, matchedRank, socket.id, playerName);
      if (!result) {
        socket.emit('guess_result', { success: false, message: 'Already found!' });
        return;
      }

      const points = result.points;
      socket.emit('guess_result', { success: true, message: `#${matchedRank}!`, points, rank: matchedRank });

      const updatedRoom = rm.getRoom(code)!;
      const answerText = updatedRoom.roundData!.answers.find((a) => a.rank === matchedRank)?.answer ?? '';

      io.to(code).emit('chat_message', {
        id: Math.random().toString(36).substring(2, 9),
        sender: 'System',
        text: `${playerName} found #${matchedRank}: "${answerText.toUpperCase()}" (+${points} pts)`,
        type: 'correct',
        timestamp: Date.now(),
      });

      io.to(code).emit('answer_revealed', {
        revealed: updatedRoom.roundData!.revealed[updatedRoom.roundData!.revealed.length - 1],
        allRevealed: updatedRoom.roundData!.revealed,
        scores: updatedRoom.scores,
        players: updatedRoom.players,
      });

      io.to(code).emit('leaderboard_update', {
        scores: updatedRoom.scores,
        players: updatedRoom.players,
      });

      // Check if all answers found — flip state immediately so late guesses are rejected,
      // then schedule the round_end broadcast after a brief animation window.
      if (rm.isRoundComplete(code)) {
        if (updatedRoom.roundData?.timerInterval) {
          clearInterval(updatedRoom.roundData.timerInterval);
          updatedRoom.roundData.timerInterval = undefined;
        }
        updatedRoom.state = 'round_end';
        setTimeout(() => {
          void endRound(io, updatedRoom).catch((err) =>
            console.error('[All-revealed] endRound failed:', err),
          );
        }, 500);
      }
    } catch {
      socket.emit('guess_result', { success: false, message: 'Error processing guess.' });
    }
  });

  // ---- next_round ----
  socket.on('next_round', async (payload: NextRoundPayload) => {
    try {
      const code = (payload.roomCode ?? '').trim().toUpperCase();
      const room = rm.getRoom(code);

      if (!room) { socket.emit('error', { message: 'Room not found.' }); return; }
      if (room.hostId !== socket.id) { socket.emit('error', { message: 'Only the host can advance the round.' }); return; }
      if (room.state !== 'round_end') { socket.emit('error', { message: 'Round has not ended yet.' }); return; }

      await startNewRound(io, room);
    } catch {
      socket.emit('error', { message: 'Failed to start next round.' });
    }
  });

  // ---- play_again ----
  socket.on('play_again', (payload: { roomCode: string }) => {
    try {
      const code = (payload.roomCode ?? '').trim().toUpperCase();
      const room = rm.getRoom(code);

      if (!room) { socket.emit('error', { message: 'Room not found.' }); return; }
      if (room.hostId !== socket.id) { socket.emit('error', { message: 'Only the host can restart.' }); return; }

      // Reset all player scores
      room.players.forEach((p) => { p.score = 0; p.roundScore = 0; });
      Object.keys(room.scores).forEach((id) => { room.scores[id] = 0; });
      room.currentRound = 0;
      room.state = 'waiting';
      room.roundData = undefined;
      roomUsedThemes.set(code, []);

      io.to(code).emit('room_updated', buildRoomState(room));
    } catch {
      socket.emit('error', { message: 'Failed to restart.' });
    }
  });

  // ---- rejoin_room ----
  // Player refreshed / reconnected / momentarily lost network. They send back
  // the playerToken we issued at create/join time; we rebind their Player
  // record to the new socket and replay the relevant state events.
  socket.on('rejoin_room', (payload: RejoinRoomPayload) => {
    try {
      const code = (payload.roomCode ?? '').trim().toUpperCase();
      const token = (payload.playerToken ?? '').trim();
      if (!code || !token) {
        socket.emit('rejoin_failed', { message: 'Missing room code or token.' });
        return;
      }

      const result = rm.rebindPlayer(code, token, socket.id);
      if (!result) {
        socket.emit('rejoin_failed', { message: 'Session no longer valid.' });
        return;
      }

      const { room, player } = result;

      // Cancel any pending removal for this player.
      const pending = disconnectTimers.get(token);
      if (pending) {
        clearTimeout(pending.timer);
        disconnectTimers.delete(token);
      }

      socket.join(code);
      socket.emit('room_joined', { roomCode: code, playerToken: token });

      io.to(code).emit('room_updated', buildRoomState(room));

      // Replay the screen-relevant events to the rejoining socket so they land
      // in the right screen with full context (same logic as mid-game join).
      if (room.state !== 'waiting' && room.roundData) {
        const rd = room.roundData;
        if (room.state === 'playing' || room.state === 'generating') {
          socket.emit('game_started', {
            category: rd.category,
            totalAnswers: 10,
            roundNumber: rd.roundNumber,
            totalRounds: room.totalRounds,
            timerSeconds: rd.timerSeconds,
          });
          if (rd.revealed.length > 0) {
            socket.emit('answer_revealed', {
              revealed: rd.revealed[rd.revealed.length - 1],
              allRevealed: rd.revealed,
              scores: room.scores,
              players: room.players,
            });
          }
        } else if (room.state === 'round_end' || room.state === 'game_end') {
          const roundWinner = rm.getRoundWinner(code);
          const isLastRound = room.currentRound >= room.totalRounds;
          socket.emit('round_end', {
            category: rd.category,
            allAnswers: rd.answers,
            revealed: rd.revealed,
            scores: room.scores,
            players: room.players,
            roundWinnerId: roundWinner?.id ?? null,
            roundWinnerName: roundWinner?.name ?? null,
            roundNumber: room.currentRound,
            isLastRound,
          });
          if (room.state === 'game_end') {
            const gameWinner = rm.getGameWinner(code);
            socket.emit('game_end', {
              scores: room.scores,
              players: room.players,
              winnerId: gameWinner?.id ?? null,
              winnerName: gameWinner?.name ?? null,
            });
          }
        }
      }

      console.log(`[Room] ${player.name} rejoined ${code}`);
    } catch {
      socket.emit('rejoin_failed', { message: 'Failed to rejoin room.' });
    }
  });

  // ---- leave_room ----
  socket.on('leave_room', (payload: LeaveRoomPayload) => {
    try {
      const code = (payload.roomCode ?? '').trim().toUpperCase();
      const room = rm.getRoom(code);
      if (!room) return;
      const player = room.players.find((p) => p.id === socket.id);
      if (!player) return;

      // Cancel any pending removal timer for them (in case they were briefly disconnected first).
      const pending = disconnectTimers.get(player.token);
      if (pending) {
        clearTimeout(pending.timer);
        disconnectTimers.delete(player.token);
      }

      finalizeRemoval(io, code, player.id, player.name, 'left the room');
      socket.leave(code);
    } catch {
      // Best-effort: leaving should never bubble an error to the user.
    }
  });

  // ---- disconnect ----
  // Don't remove immediately — mark them as offline and give them a grace
  // window to reconnect (refresh, brief network blip). After the grace expires,
  // finalize their removal.
  socket.on('disconnect', () => {
    guessBuckets.delete(socket.id);
    createRoomLastAt.delete(socket.id);

    for (const [code, room] of rm.getAllRooms().entries()) {
      const player = room.players.find((p) => p.id === socket.id);
      if (!player) continue;

      const marked = rm.markDisconnected(code, socket.id);
      if (!marked) continue;

      io.to(code).emit('room_updated', buildRoomState(room));

      const timer = setTimeout(() => {
        disconnectTimers.delete(player.token);
        const room2 = rm.getRoom(code);
        if (!room2) return;
        const p2 = room2.players.find((p) => p.token === player.token);
        if (!p2 || !p2.disconnected) return; // they came back
        finalizeRemoval(io, code, p2.id, p2.name, 'left the room');
      }, DISCONNECT_GRACE_MS);
      disconnectTimers.set(player.token, { timer, code });

      console.log(`[Room] ${player.name} disconnected from ${code} (grace ${DISCONNECT_GRACE_MS / 1000}s)`);
    }
  });
}

/**
 * Actually remove a player from a room and broadcast. Used by leave_room and
 * by the disconnect grace timer when the player doesn't return.
 */
function finalizeRemoval(
  io: Server,
  code: string,
  playerId: string,
  playerName: string,
  reason: string
): void {
  const updatedRoom = rm.removePlayer(code, playerId);
  if (!updatedRoom) return;

  if (updatedRoom.players.length === 0) {
    if (updatedRoom.roundData?.timerInterval) {
      clearInterval(updatedRoom.roundData.timerInterval);
    }
    rm.deleteRoom(code);
    console.log(`[Room] ${code} deleted (empty)`);
    return;
  }

  io.to(code).emit('player_left', {
    playerId,
    playerName,
    roomState: buildRoomState(updatedRoom),
  });
  io.to(code).emit('room_updated', buildRoomState(updatedRoom));
  io.to(code).emit('chat_message', {
    id: Math.random().toString(36).substring(2, 9),
    sender: 'System',
    text: `${playerName} ${reason}`,
    type: 'system',
    timestamp: Date.now(),
  });
  console.log(`[Room] ${playerName} ${reason} ${code}`);
}
