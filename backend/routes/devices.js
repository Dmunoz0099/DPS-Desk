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
  createEmpresa,
  createLocal,
  createPos,
  deletePos,
  deleteLocal,
  deleteEmpresa,
  updateEmpresa,
  updateLocal,
  updatePos,
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

// Refresca el campo `estado` de un POS según si el agente está conectado
// por WebSocket en este momento. La columna estado en la DB queda como
// fuente histórica/inicial; la verdad de "online ahora mismo" vive en memoria.
function withLiveEstado(p) {
  if (!p) return p;
  return Object.assign({}, p, {
    estado: onlineDevices.has(p.id) ? 'online' : 'offline',
  });
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
    res.json((data || []).map(withLiveEstado));
  } catch (err) {
    console.error('[Devices] GET /locales/:id/pos error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /devices/pos/:posId
// Busca primero en devices (agents con UUID), luego en pos (terminales tradicionales)
router.get('/pos/:posId', async (req, res) => {
  try {
    const posId = req.params.posId;

    // Intenta buscar en devices (agents registrados)
    const device = await getRegisteredDevice(posId);
    if (device) {
      return res.json({
        id: device.pos_id,
        numero: null,
        hostname: device.hostname || null,
        localId: null,
        empresaId: null,
        estado: onlineDevices.has(device.pos_id) ? 'online' : 'offline',
        ip: device.ip || null,
        version: device.version || null,
        empresaNombre: 'Agent DPS',
        localNombre: 'Remote',
        hardware: {
          cpu: null,
          ram: null,
          disco: null,
          os: device.os || null,
        },
        ultimaActividadMin: 0,
      });
    }

    // Si no está en devices, busca en pos
    const p = await getPosPorId(posId);
    if (!p) return res.status(404).json({ error: 'POS no encontrado' });
    res.json(withLiveEstado(p));
  } catch (err) {
    console.error('[Devices] GET /pos/:id error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /devices/empresas
router.post('/empresas', async (req, res) => {
  try {
    const { id, nombre } = req.body || {};
    if (!id || !nombre) return res.status(400).json({ error: 'id y nombre requeridos' });
    const r = await createEmpresa({ id, nombre });
    res.status(201).json(r);
  } catch (err) {
    console.error('[Devices] POST /empresas:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /devices/locales
router.post('/locales', async (req, res) => {
  try {
    const { id, empresa_id, nombre } = req.body || {};
    if (!id || !empresa_id || !nombre) {
      return res.status(400).json({ error: 'id, empresa_id y nombre requeridos' });
    }
    const r = await createLocal({ id, empresa_id, nombre });
    res.status(201).json(r);
  } catch (err) {
    console.error('[Devices] POST /locales:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /devices/pos
router.post('/pos', async (req, res) => {
  try {
    const { id, numero, local_id, empresa_id } = req.body || {};
    if (!id || numero == null || !local_id || !empresa_id) {
      return res.status(400).json({ error: 'id, numero, local_id y empresa_id requeridos' });
    }
    const r = await createPos(req.body);
    res.status(201).json(r);
  } catch (err) {
    console.error('[Devices] POST /pos:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /devices/pos/:posId
router.delete('/pos/:posId', async (req, res) => {
  try {
    await deletePos(req.params.posId);
    res.json({ ok: true });
  } catch (err) {
    console.error('[Devices] DELETE /pos/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /devices/locales/:localId
router.delete('/locales/:localId', async (req, res) => {
  try {
    await deleteLocal(req.params.localId);
    res.json({ ok: true });
  } catch (err) {
    console.error('[Devices] DELETE /locales/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /devices/empresas/:empresaId
router.delete('/empresas/:empresaId', async (req, res) => {
  try {
    await deleteEmpresa(req.params.empresaId);
    res.json({ ok: true });
  } catch (err) {
    console.error('[Devices] DELETE /empresas/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /devices/empresas/:empresaId
router.patch('/empresas/:empresaId', async (req, res) => {
  try {
    const { nombre } = req.body || {};
    if (!nombre || !nombre.trim()) return res.status(400).json({ error: 'nombre requerido' });
    const data = await updateEmpresa(req.params.empresaId, { nombre: nombre.trim() });
    res.json(data);
  } catch (err) {
    console.error('[Devices] PATCH /empresas/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /devices/locales/:localId
router.patch('/locales/:localId', async (req, res) => {
  try {
    const { nombre } = req.body || {};
    if (!nombre || !nombre.trim()) return res.status(400).json({ error: 'nombre requerido' });
    const data = await updateLocal(req.params.localId, { nombre: nombre.trim() });
    res.json(data);
  } catch (err) {
    console.error('[Devices] PATCH /locales/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /devices/pos/:posId
router.patch('/pos/:posId', async (req, res) => {
  try {
    const { numero } = req.body || {};
    const num = parseInt(numero, 10);
    if (!Number.isFinite(num)) return res.status(400).json({ error: 'numero inválido' });
    const data = await updatePos(req.params.posId, { numero: num });
    res.json(data);
  } catch (err) {
    console.error('[Devices] PATCH /pos/:id:', err.message);
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
