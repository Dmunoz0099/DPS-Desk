require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { WebSocketServer, WebSocket } = require('ws');

const { router: devicesRouter, setDeviceOnline } = require('./routes/devices');
const { router: sessionsRouter, sessions } = require('./routes/sessions');
const authRouter = require('./routes/auth');
const { deleteSessionRowsOlderThan } = require('./db/supabase');

const app = express();
const PORT = process.env.PORT || 4000;

// CORS para navegador + Electron
const corsOrigin = process.env.CORS_ORIGIN || '*';
const corsOrigins = corsOrigin === '*'
  ? true
  : corsOrigin.split(',').map(s => s.trim());
app.use(cors({
  origin: corsOrigins,
  credentials: corsOrigin !== '*',
}));
app.use(express.json({ limit: '1mb' }));

// ── Logging middleware ───────────────────────────────────────────────────────
app.use((req, _res, next) => {
  if (req.path !== '/') {
    console.log(`[HTTP] ${req.method} ${req.path}`);
  }
  next();
});

app.get('/', (_req, res) => {
  res.json({
    name: 'DPSDESK API',
    version: '2.0.0',
    status: 'online',
    agents: agentsOnline(),
    sessions: sessions.size,
    endpoints: ['/api/auth/login', '/api/devices', '/api/sessions', '/api/agents'],
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', agents: agentsOnline(), sessions: sessions.size });
});

// Endpoint para verificar agents conectados
function handleAgentsList(_req, res) {
  const list = [];
  rooms.forEach((room, id) => {
    if (room.agent) list.push({ posId: id, status: 'connected' });
  });
  res.json({ count: list.length, agents: list });
}

function handleAgentStatus(req, res) {
  const room = rooms.get(req.params.posId);
  const connected = !!(room?.agent && room.agent.readyState === WebSocket.OPEN);
  res.json({ posId: req.params.posId, connected });
}

app.get('/agents', handleAgentsList);
app.get('/agents/:posId', handleAgentStatus);
app.get('/api/agents', handleAgentsList);
app.get('/api/agents/:posId', handleAgentStatus);

app.use('/auth', authRouter);
app.use('/devices', devicesRouter);
app.use('/sessions', sessionsRouter);
app.use('/api/auth', authRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/sessions', sessionsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, _req, res, _next) => {
  console.error('[HTTP] Error:', err.message);
  res.status(500).json({ error: err.message });
});

// ── HTTP server (shared with WS) ─────────────────────────────────────────────
const server = http.createServer(app);

// ── WebSocket Signaling Server ───────────────────────────────────────────────
const rooms = new Map();
const HEARTBEAT_INTERVAL = 10000;

function getOrCreateRoom(id) {
  if (!rooms.has(id)) {
    rooms.set(id, { agent: null, browser: null });
  }
  return rooms.get(id);
}

function cleanupRoom(id) {
  const room = rooms.get(id);
  if (!room) return;
  if (!room.agent && !room.browser) rooms.delete(id);
}

function agentsOnline() {
  let count = 0;
  rooms.forEach((room) => {
    if (room.agent && room.agent.readyState === WebSocket.OPEN) count++;
  });
  return count;
}

function safeSend(ws, obj) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(JSON.stringify(obj));
      return true;
    } catch (err) {
      console.error('[WS] send error:', err.message);
    }
  }
  return false;
}

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  let currentSessionId = null;
  let currentRole = null;
  let heartbeatInterval = null;

  ws.isAlive = true;

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  // Heartbeat
  heartbeatInterval = setInterval(() => {
    if (!ws.isAlive) {
      console.log(`[WS] Heartbeat timeout for ${currentRole}=${currentSessionId}`);
      clearInterval(heartbeatInterval);
      return ws.terminate();
    }
    ws.isAlive = false;
    try {
      ws.ping();
    } catch {}
  }, HEARTBEAT_INTERVAL);

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      console.warn(`[WS] Invalid JSON from ${ip}`);
      return;
    }

    const { type, sessionId, payload } = msg;

    if (!type) {
      safeSend(ws, { type: 'error', message: 'type field required' });
      return;
    }

    // ── JOIN ─────────────────────────────────────────────────────────────────
    if (type === 'join') {
      const role = payload?.role;
      const posId = payload?.posId;

      if (!role || !posId) {
        safeSend(ws, { type: 'error', message: 'role and posId required' });
        return;
      }

      if (role === 'agent') {
        const existing = rooms.get(posId);
        if (existing?.agent && existing.agent !== ws && existing.agent.readyState === WebSocket.OPEN) {
          console.log(`[WS] Replacing previous agent connection for posId=${posId}`);
          try { existing.agent.close(); } catch {}
        }
        currentRole = 'agent';
        currentSessionId = posId;
        getOrCreateRoom(posId).agent = ws;
        setDeviceOnline(posId, true);
        safeSend(ws, { type: 'joined', role: 'agent', posId });
        console.log(`[WS] Agent joined posId=${posId} from ${ip}`);
        return;
      }

      if (role === 'browser') {
        if (!sessionId) {
          safeSend(ws, { type: 'error', message: 'sessionId required for browser' });
          return;
        }
        currentRole = 'browser';
        currentSessionId = sessionId;
        const room = getOrCreateRoom(sessionId);
        room.browser = ws;
        room.agentPosId = posId;

        safeSend(ws, { type: 'joined', role: 'browser', sessionId });

        const agentRoom = rooms.get(posId);
        if (agentRoom?.agent && agentRoom.agent.readyState === WebSocket.OPEN) {
          safeSend(agentRoom.agent, { type: 'browser-ready', sessionId });
          console.log(`[WS] Browser joined session=${sessionId} → notified agent posId=${posId}`);
        } else {
          safeSend(ws, { type: 'agent-offline', message: 'Agent no conectado para este POS' });
          console.log(`[WS] Browser joined session=${sessionId} but agent posId=${posId} OFFLINE`);
        }
        return;
      }

      safeSend(ws, { type: 'error', message: `Unknown role: ${role}` });
      return;
    }

    // ── SIGNALING RELAY ──────────────────────────────────────────────────────
    if (['offer', 'answer', 'ice-candidate', 'screen-resolution'].includes(type)) {
      if (currentRole === 'agent') {
        const browserRoom = rooms.get(sessionId);
        if (browserRoom?.browser?.readyState === WebSocket.OPEN) {
          safeSend(browserRoom.browser, { type, payload });
        } else {
          console.warn(`[WS] Agent → browser relay failed (browser offline) session=${sessionId}`);
        }
      } else if (currentRole === 'browser') {
        const browserRoom = rooms.get(currentSessionId);
        const agentPosId = browserRoom?.agentPosId;
        const agentRoom = agentPosId ? rooms.get(agentPosId) : null;
        if (agentRoom?.agent?.readyState === WebSocket.OPEN) {
          safeSend(agentRoom.agent, { type, sessionId: currentSessionId, payload });
        } else {
          console.warn(`[WS] Browser → agent relay failed (agent offline) session=${currentSessionId}`);
        }
      }
      return;
    }

    // ── PING (manual) ────────────────────────────────────────────────────────
    if (type === 'ping') {
      safeSend(ws, { type: 'pong', ts: Date.now() });
      return;
    }
  });

  ws.on('close', () => {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    if (!currentSessionId) return;

    if (currentRole === 'agent') {
      const room = rooms.get(currentSessionId);
      if (room && room.agent === ws) {
        room.agent = null;
        setDeviceOnline(currentSessionId, false);
        // Notificar a browsers conectadas a este agent
        rooms.forEach((bRoom, bId) => {
          if (bRoom.agentPosId === currentSessionId && bRoom.browser?.readyState === WebSocket.OPEN) {
            safeSend(bRoom.browser, { type: 'agent-disconnected', posId: currentSessionId });
          }
        });
        cleanupRoom(currentSessionId);
      }
      console.log(`[WS] Agent disconnected posId=${currentSessionId}`);
    } else if (currentRole === 'browser') {
      const room = rooms.get(currentSessionId);
      const agentPosId = room?.agentPosId;
      if (room && room.browser === ws) {
        room.browser = null;
        cleanupRoom(currentSessionId);
      }
      if (agentPosId) {
        const agentRoom = rooms.get(agentPosId);
        if (agentRoom?.agent?.readyState === WebSocket.OPEN) {
          safeSend(agentRoom.agent, { type: 'browser-left', sessionId: currentSessionId });
        }
      }
      console.log(`[WS] Browser disconnected session=${currentSessionId}`);
    }
  });

  ws.on('error', (err) => console.error('[WS] error:', err.message));
});

// Cleanup sesiones huérfanas cada 5 minutos
const SESSION_TTL_MS = 4 * 60 * 60 * 1000;
setInterval(async () => {
  const now = Date.now();
  let cleaned = 0;
  sessions.forEach((s, id) => {
    const ageMs = now - new Date(s.createdAt).getTime();
    if (ageMs > SESSION_TTL_MS) {
      sessions.delete(id);
      cleaned++;
    }
  });
  if (cleaned > 0) console.log(`[Cleanup] Removed ${cleaned} stale sessions (memoria)`);

  // Limpiar BD también (best-effort)
  try {
    const cutoff = new Date(now - SESSION_TTL_MS).toISOString();
    await deleteSessionRowsOlderThan(cutoff);
  } catch (err) {
    console.warn('[Cleanup] BD purge falló:', err.message);
  }
}, 5 * 60 * 1000);

server.listen(PORT, () => {
  console.log(`╔═══════════════════════════════════════════════════════╗`);
  console.log(`║  DPSDESK API + WS Signaling                           ║`);
  console.log(`║  HTTP : http://localhost:${PORT}                          ║`);
  console.log(`║  WS   : ws://localhost:${PORT}/ws                         ║`);
  console.log(`╚═══════════════════════════════════════════════════════╝`);
});

module.exports = { rooms };
