const express = require('express');
const {
  getEmpresasConMetricas,
  getLocalesConMetricas,
  getPosPorLocal,
  getPosPorId,
  getTotales,
  registerDevice,
  getRegisteredDevices,
  getRegisteredDevice,
  updateDeviceLastSeen,
} = require('../db/supabase');

const router = express.Router();

// In-memory online status tracking (from WS)
const onlineDevices = new Set();

function setDeviceOnline(posId, online) {
  if (online) {
    onlineDevices.add(posId);
  } else {
    onlineDevices.delete(posId);
  }
}

// GET /devices
router.get('/', async (_req, res) => {
  try {
    const [totales, empresas] = await Promise.all([
      getTotales(),
      getEmpresasConMetricas(),
    ]);
    res.json({ totales, empresas });
  } catch (err) {
    console.error('[Devices] GET / error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /devices/empresas
router.get('/empresas', async (_req, res) => {
  try {
    const empresas = await getEmpresasConMetricas();
    res.json(empresas);
  } catch (err) {
    console.error('[Devices] GET /empresas error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /devices/empresas/:empresaId/locales
router.get('/empresas/:empresaId/locales', async (req, res) => {
  try {
    const data = await getLocalesConMetricas(req.params.empresaId);
    res.json(data);
  } catch (err) {
    console.error('[Devices] GET /empresas/:id/locales error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /devices/locales/:localId/pos
router.get('/locales/:localId/pos', async (req, res) => {
  try {
    const data = await getPosPorLocal(req.params.localId);
    res.json(data);
  } catch (err) {
    console.error('[Devices] GET /locales/:id/pos error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /devices/pos/:posId
router.get('/pos/:posId', async (req, res) => {
  try {
    const p = await getPosPorId(req.params.posId);
    if (!p) return res.status(404).json({ error: 'POS no encontrado' });
    res.json(p);
  } catch (err) {
    console.error('[Devices] GET /pos/:id error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /devices/register
router.post('/register', async (req, res) => {
  try {
    const { posId, hostname, ip, os, version, screenWidth, screenHeight } = req.body;
    if (!posId) return res.status(400).json({ error: 'posId required' });

    await registerDevice(posId, hostname, ip, os, version, screenWidth, screenHeight);
    console.log(`[Devices] ${posId} (${hostname}) registered`);
    res.json({ posId, registered: true });
  } catch (err) {
    console.error('[Devices] POST /register error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /devices/registered
router.get('/registered', async (_req, res) => {
  try {
    const devices = await getRegisteredDevices();
    const list = devices.map(dev => ({
      ...dev,
      online: onlineDevices.has(dev.pos_id),
    }));
    res.json(list);
  } catch (err) {
    console.error('[Devices] GET /registered error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /devices/registered/:posId
router.get('/registered/:posId', async (req, res) => {
  try {
    const dev = await getRegisteredDevice(req.params.posId);
    if (!dev) return res.status(404).json({ error: 'Device no encontrado' });
    res.json({
      ...dev,
      online: onlineDevices.has(req.params.posId),
    });
  } catch (err) {
    console.error('[Devices] GET /registered/:id error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = { router, setDeviceOnline };
