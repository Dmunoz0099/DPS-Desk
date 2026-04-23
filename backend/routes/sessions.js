const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { getPosPorId } = require('../data/mockData');

const router = express.Router();

// Sesiones en memoria — en producción se persisten en BD para auditar conexiones.
const sessions = new Map();

const TURN_SECRET = process.env.TURN_SECRET || 'dev_secret_change_in_prod';
const TURN_HOST   = process.env.TURN_HOST   || '127.0.0.1';
const TURN_PORT   = process.env.TURN_PORT   || '3478';

function generateTurnCredentials(ttlSeconds = 3600) {
  const timestamp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const username  = `${timestamp}:dpsdesk`;
  const credential = crypto
    .createHmac('sha1', TURN_SECRET)
    .update(username)
    .digest('base64');
  return { username, credential };
}

function buildIceServers() {
  // Red local: sin STUN/TURN (P2P directo)
  // Si no funciona, agregar servidores TURN locales
  return [];
}

// POST /sessions  { posId } → crea una sesión WebRTC
router.post('/', (req, res) => {
  const { posId } = req.body || {};
  if (!posId) return res.status(400).json({ error: 'posId requerido' });
  const pos = getPosPorId(posId);
  if (!pos) return res.status(404).json({ error: 'POS no encontrado' });

  const sessionId = uuidv4();
  sessions.set(sessionId, {
    id: sessionId,
    posId,
    createdAt: new Date().toISOString(),
    estado: 'iniciada',
  });

  res.status(201).json({
    sessionId,
    posId,
    iceServers: buildIceServers(),
  });
});

// GET /sessions/ice-config → devuelve ICE servers frescos sin crear sesión (para el agent)
router.get('/ice-config', (_req, res) => {
  res.json({ iceServers: buildIceServers() });
});

router.get('/', (_req, res) => {
  res.json(Array.from(sessions.values()));
});

router.get('/:id', (req, res) => {
  const s = sessions.get(req.params.id);
  if (!s) return res.status(404).json({ error: 'Sesión no encontrada' });
  res.json(s);
});

router.delete('/:id', (req, res) => {
  const ok = sessions.delete(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Sesión no encontrada' });
  res.json({ ok: true });
});

module.exports = { router, sessions };
