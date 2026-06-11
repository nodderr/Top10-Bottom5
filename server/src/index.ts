// ============================================================
// Server entrypoint — Express + Socket.io
// Self-pinging to keep Render.com free tier alive
// ============================================================

import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { registerHandlers } from './socketHandler';
import { startCleanup } from './roomManager';

const app = express();
const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';
const PORT = parseInt(process.env.PORT ?? '3001', 10);

// ---- Socket.io setup ----
const io = new Server(server, {
  cors: {
    origin: [FRONTEND_URL, 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ---- Health check endpoint (used by self-ping) ----
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/', (_req, res) => {
  res.json({ app: 'Top 10 Bottom 5 Game Server', version: '1.0.0' });
});

// ---- Socket connection ----
io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);
  registerHandlers(io, socket);
  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
  });
});

// ---- Start server ----
server.listen(PORT, () => {
  console.log(`\n🎮 Top 10 Bottom 5 server running on port ${PORT}`);
  console.log(`   Frontend: ${FRONTEND_URL}`);
  console.log(`   Health:   http://localhost:${PORT}/health\n`);

  // Start room cleanup scheduler
  startCleanup();

  // Self-ping to keep Render.com free tier alive (every 14 min)
  const SELF_URL = process.env.RENDER_EXTERNAL_URL;
  if (SELF_URL) {
    console.log(`[Self-ping] Enabled → ${SELF_URL}/health`);
    setInterval(async () => {
      try {
        const res = await fetch(`${SELF_URL}/health`);
        console.log(`[Self-ping] OK (${res.status})`);
      } catch (err) {
        console.warn('[Self-ping] Failed:', err);
      }
    }, 14 * 60 * 1000);
  } else {
    console.log('[Self-ping] Disabled (RENDER_EXTERNAL_URL not set)');
  }
});

export { io };
