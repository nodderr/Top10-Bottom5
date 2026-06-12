// ============================================================
// Socket.io event handler — the game's core logic
// ============================================================

import { Server, Socket } from 'socket.io';
import * as rm from './roomManager';
import { generateRanking, generateRankingForCustomPrompt } from './aiProvider';
import { findMatchingRank } from './fuzzyMatcher';
import {
  CreateRoomPayload,
  JoinRoomPayload,
  SubmitGuessPayload,
  StartGamePayload,
  NextRoundPayload,
  Room,
} from './types';

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
    hostId: room.hostId,
  };
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
      endRound(io, room);
    }
  }, 1000);
}

function endRound(io: Server, room: Room): void {
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
      timerSeconds: 90,
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
      // Trim + cap custom prompts to mitigate prompt-injection. Empty entries are kept
      // (they trigger the random-AI fallback for that round, which is the documented behavior).
      const sanitizedPrompts = Array.isArray(payload.customPrompts)
        ? payload.customPrompts.slice(0, totalRounds).map((p) =>
            typeof p === 'string' ? p.replace(/[\r\n]+/g, ' ').trim().slice(0, 120) : ''
          )
        : undefined;
      const room = rm.createRoom(socket.id, name, totalRounds, sanitizedPrompts);

      socket.join(room.code);
      socket.emit('room_created', { roomCode: room.code });
      socket.emit('room_updated', buildRoomState(room));

      console.log(`[Room] Created ${room.code} by ${name}`);
    } catch (err) {
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

      const updatedRoom = rm.addPlayer(code, socket.id, name);
      if (!updatedRoom) {
        socket.emit('error', { message: 'Could not join room.' });
        return;
      }

      socket.join(code);
      socket.emit('room_joined', { roomCode: code });

      const player = updatedRoom.players.find((p) => p.id === socket.id);
      io.to(code).emit('player_joined', { player, roomState: buildRoomState(updatedRoom) });
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
    } catch (err) {
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
    } catch (err) {
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
        setTimeout(() => endRound(io, updatedRoom), 500);
      }
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
      socket.emit('error', { message: 'Failed to restart.' });
    }
  });

  // ---- disconnect ----
  socket.on('disconnect', () => {
    // Drop per-socket rate-limit state
    guessBuckets.delete(socket.id);
    createRoomLastAt.delete(socket.id);

    // Find all rooms this socket was in and remove them
    for (const [code, room] of rm.getAllRooms().entries()) {
      const wasInRoom = room.players.find((p) => p.id === socket.id);
      if (!wasInRoom) continue;

      const updatedRoom = rm.removePlayer(code, socket.id);
      if (!updatedRoom) continue;

      if (updatedRoom.players.length === 0) {
        // Empty room — clean up
        if (updatedRoom.roundData?.timerInterval) {
          clearInterval(updatedRoom.roundData.timerInterval);
        }
        rm.deleteRoom(code);
        roomUsedThemes.delete(code);
        console.log(`[Room] ${code} deleted (empty)`);
      } else {
        io.to(code).emit('player_left', {
          playerId: socket.id,
          playerName: wasInRoom.name,
          roomState: buildRoomState(updatedRoom),
        });
        io.to(code).emit('room_updated', buildRoomState(updatedRoom));
        
        io.to(code).emit('chat_message', {
          id: Math.random().toString(36).substring(2, 9),
          sender: 'System',
          text: `${wasInRoom.name} left the room`,
          type: 'system',
          timestamp: Date.now(),
        });

        console.log(`[Room] ${wasInRoom.name} left ${code}`);
      }
    }
  });
}
