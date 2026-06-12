# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Repo Layout

Two npm packages in one repo:

- **Root** (`/`) — Next.js 16 frontend (App Router, React 19, Tailwind v4). Also owns the Postgres-backed auth API routes and the leaderboard route.
- **`server/`** — Express + Socket.io game server. Owns room state, AI ranking generation (Gemini), fuzzy guess matching, and ELO writeback. Runs as its own process.

The two share a Postgres database (Neon) and a session cookie scheme (`SESSION_SECRET` HMAC, see `src/lib/auth/session.ts` ↔ `server/src/authSession.ts` — these must stay in sync). Either process can validate a cookie issued by the other; the Socket.io `io.use` middleware in `server/src/index.ts` reads the cookie off the WS handshake and attaches `socket.data.authedUser`.

## Commands

### Frontend (run from repo root)
```
npm run dev        # Next.js dev server on :3000
npm run build      # next build
npm run start      # next start
npm run lint       # eslint
```

### Server (run from `server/`)
```
npm run dev        # ts-node-dev on :3001, auto-respawn
npm run build      # tsc → server/dist
npm start          # node dist/index.js
npm run migrate    # apply server/migrations/*.sql in order, tracked in public.schema_migrations
```

No test runner is configured.

### Env vars
- Frontend (`.env.local`): `NEXT_PUBLIC_SOCKET_URL`, `DATABASE_URL`, `SESSION_SECRET`
- Server (`server/.env`): `GEMINI_API_KEY`, `DATABASE_URL`, `SESSION_SECRET`, `FRONTEND_URL`, optional `RENDER_EXTERNAL_URL` (enables 14-min self-ping for Render free tier)

`DATABASE_URL` and `SESSION_SECRET` must match across both sides. The user provides the Neon connection string manually — do not call Neon MCP tools.

## Architecture

### Realtime game loop (`server/src/socketHandler.ts`)
The whole gameplay flow is socket events, not REST. Key flow:

1. `create_room` / `join_room` → `roomManager.createRoom`/`addPlayer`. Each player gets a `playerToken` (UUID) returned to the client and persisted in `sessionStorage`.
2. `start_game` → `startNewRound` calls `aiProvider.generateRanking` (or `generateRankingForCustomPrompt`) → emits `game_started`, starts a per-round interval timer.
3. `submit_guess` → `fuzzyMatcher.findMatchingRank` → `recordReveal` → broadcasts `answer_revealed` + `leaderboard_update`. Server flips `room.state` to `round_end` immediately on completion, then schedules the broadcast after a short animation window.
4. End of each round: `eloWriteback.applyRoundElo` inserts `public.round_results` rows and updates `public.elo_ratings`, returning per-player deltas that ride along in the `round_end` payload.
5. `game_end` → `eloWriteback.finalizeGame` stamps `games.ended_at` and bumps `games_played`.

Room state is **in-memory only** (`Map<code, Room>` in `roomManager.ts`). Restarting the server drops all active rooms. Only ELO and history get persisted.

### Reconnection model
Disconnects are not immediately destructive. `disconnect` marks the player offline and starts a 30s grace timer; the client can call `rejoin_room` with its stored `playerToken` to rebind to the existing `Player` record. Both `join_room` (mid-game) and `rejoin_room` replay the screen-relevant events (`game_started` / `answer_revealed` / `round_end` / `game_end`) to the new socket so it lands on the right screen.

Rate limits live in `socketHandler.ts`: per-socket guess token bucket (~5/sec) and 10s `create_room` throttle.

### Auth
Own-rolled email+password. `src/lib/auth/password.ts` (bcrypt), `src/lib/auth/session.ts` (cookie = `<rawToken>.<hmac>`, DB stores `sha256(rawToken)`). Routes in `src/app/api/auth/{login,register,logout,me}/route.ts`. Client state via `src/context/AuthContext.tsx`. The server-side mirror in `server/src/authSession.ts` exists so Socket.io can identify the user from the handshake cookie — keep the two in lockstep when changing the scheme.

### Frontend state
`src/context/RoomContext.tsx` is the single store: a `useReducer` that consumes every game socket event and drives the room/game/round/leaderboard UI. `useSocket` (`src/hooks/useSocket.ts`) owns the singleton Socket.io client. Pages are thin — `src/app/room/[code]/page.tsx` selects which screen component to render based on `gameState`.

### Database
Migrations in `server/migrations/`, applied via `npm run migrate` from `server/`. Tables: `users`, `sessions`, `games`, `round_results`, `elo_ratings`, `schema_migrations`. Both the Next.js side (`src/lib/db.ts`) and server (`server/src/db.ts`) open their own `pg.Pool` against the same `DATABASE_URL`. Default ELO is 1400 (see migration 002).

### AI ranking
`server/src/aiProvider.ts` calls Gemini and returns `{ category, answers: RankedAnswer[10], theme }`. Theme buckets are tracked per-room (`roomUsedThemes` in `socketHandler.ts`) so consecutive rounds don't repeat. Custom prompts from the host (one per round, up to `totalRounds`) take precedence and are sanitized + length-capped to mitigate prompt injection. Scoring: rank N is worth `(11-N) * 1000` points (scaled ×1000 for game-feel, defined in `roomManager.ts:POINTS_SCALE`).

## Deployment

- Frontend → Vercel
- Server → Render (config in `render.yaml`, `rootDir: server`)
- DB → Neon

The server self-pings `/health` every 14 min when `RENDER_EXTERNAL_URL` is set to avoid Render free-tier spin-down.
