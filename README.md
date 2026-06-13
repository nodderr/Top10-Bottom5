# Top 10 Bottom 5

> A multiplayer social party game. Guess what the AI ranked. Debate, laugh, argue.

**Inspired by:** Family Feud · Google Feud · Kahoot · Podcast ranking discussions

## How It Works

1. Create a room, share the 6-character code
2. Friends join — no accounts needed
3. AI generates a hidden Top 10 ranking list
4. Players guess answers — correct guesses reveal positions
5. Higher ranks = more points
6. When the round ends, all answers are revealed
7. Argue about the rankings. Next round begins.

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15, TypeScript, TailwindCSS, Framer Motion |
| Real-time | Socket.io |
| Backend | Express + Socket.io (Node.js) |
| AI | Gemini 3.1 Flash Lite |
| Frontend hosting | Vercel |
| Backend hosting | Render.com (free, self-pinging) |

---

## Local Development

### Prerequisites
- Node.js 18+
- A [Gemini API key](https://aistudio.google.com) (free)

### 1. Set up the frontend

```bash
# Install dependencies (already done by scaffold)
npm install

# Create env file
cp .env.example .env.local
# Edit .env.local — set NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# Run frontend
npm run dev
```

### 2. Set up the backend

```bash
cd server

# Install dependencies
npm install

# Create env file
cp .env.example .env
# Edit .env — set your GEMINI_API_KEY

# Run server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in two browser tabs to test multiplayer locally.

---

## Deployment

### Backend → Render.com

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Set **Root Directory** to `server`
5. **Build Command:** `npm install && npm run build`
6. **Start Command:** `npm start`
7. Add environment variables:
   - `GEMINI_API_KEY` — your Gemini API key
   - `FRONTEND_URL` — your Vercel frontend URL (set after step below)
8. Deploy → copy your Render URL (e.g. `https://top10-bottom5-server.onrender.com`)

> **Self-ping keep-alive:** The server automatically pings its own `/health` endpoint every 14 minutes to prevent Render's free tier spin-down. No external service needed.

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → Import Project
2. Select your GitHub repo
3. Add environment variable:
   - `NEXT_PUBLIC_SOCKET_URL` — your Render server URL from above
4. Deploy

---

## Scoring

| Rank | Points |
|---|---|
| #1 | 10 pts |
| #2 | 9 pts |
| ... | ... |
| #10 | 1 pt |

First player to guess each answer wins its points. Once found, it's locked.

## Category Bank

25 curated categories covering: Indian Food, Cities, Brands, Cricketers, IPL Teams, Bollywood, Marvel/DC, Anime, Cars, Apps, YouTubers, and more.
