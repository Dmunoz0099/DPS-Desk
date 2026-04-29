// =============================================================
// DPS DESK — Cliente HTTP del backend
//
// Expone window.API. Mantiene los datos en la misma forma que
// window.MOCK (data.js) para que los componentes existentes
// (dashboard.jsx, network.jsx) no tengan que cambiar su acceso
// a window.MOCK.COMPANIES / .LOCALES / .DEVICES.
// =============================================================
(function () {
  const DEFAULT_BASE = 'https://backend-production-a5b7d.up.railway.app';

  function getBaseURL() {
    try { return localStorage.getItem('DPS_API_URL') || DEFAULT_BASE; }
    catch { return DEFAULT_BASE; }
  }
  function setBaseURL(url) {
    try { localStorage.setItem('DPS_API_URL', url); } catch {}
  }
  function getToken() {
    try { return localStorage.getItem('DPS_TOKEN') || ''; } catch { return ''; }
  }
  function setToken(t) {
    try { localStorage.setItem('DPS_TOKEN', t); } catch {}
  }
  function clearToken() {
    try { localStorage.removeItem('DPS_TOKEN'); } catch {}
  }
  function getWSUrl() {
    return getBaseURL().replace(/^https:/, 'wss:').replace(/^http:/, 'ws:') + '/ws';
  }

  async function request(path, options = {}) {
    const url = getBaseURL() + path;
    const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    const tok = getToken();
    if (tok) headers.Authorization = 'Bearer ' + tok;
    const res = await fetch(url, Object.assign({}, options, { headers }));
    if (!res.ok) {
      let body = '';
      try { body = (await res.json()).error || ''; } catch {}
      throw new Error(body || ('HTTP ' + res.status));
    }
    return res.json();
  }

  // ── Auth ────────────────────────────────────────────────────────────────
  async function login(username, password) {
    const r = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (r && r.token) setToken(r.token);
    return r;
  }
  async function me() {
    return request('/api/auth/me');
  }

  // ── Sessions (WebRTC) ───────────────────────────────────────────────────
  async function createSession(posId) {
    return request('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ posId }),
    });
  }
  async function deleteSession(sessionId) {
    return request('/api/sessions/' + encodeURIComponent(sessionId), { method: 'DELETE' });
  }

  // ── Altas (empresa / local / pos) ───────────────────────────────────────
  async function createEmpresa(payload) {
    return request('/api/devices/empresas', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
  async function createLocal(payload) {
    return request('/api/devices/locales', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
  async function createPos(payload) {
    return request('/api/devices/pos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
  async function deletePos(posId) {
    return request('/api/devices/pos/' + encodeURIComponent(posId), { method: 'DELETE' });
  }

  // ── Network data — devuelve la forma de window.MOCK ─────────────────────
  // Backend → endpoints encadenados:
  //   /api/devices/empresas
  //   /api/devices/empresas/:id/locales
  //   /api/devices/locales/:id/pos
  //   /api/devices/registered  (agents Electron)
  const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  async function getNetworkData() {
    const empresas = await request('/api/devices/empresas');

    const localesPorEmpresa = await Promise.all(
      empresas.map(async (e) => {
        const ls = await request('/api/devices/empresas/' + encodeURIComponent(e.id) + '/locales');
        return ls.map((l) => Object.assign({}, l, {
          empresaId: e.id,
          empresaNombre: e.nombre,
        }));
      })
    );
    const allLocales = localesPorEmpresa.flat();

    const posPorLocal = await Promise.all(
      allLocales.map(async (l) => {
        const ps = await request('/api/devices/locales/' + encodeURIComponent(l.id) + '/pos');
        return ps.map((p) => Object.assign({}, p, { _localId: l.id, _localNombre: l.nombre }));
      })
    );
    const allPos = posPorLocal.flat();

    const COMPANIES = empresas.map((e, i) => ({
      name: e.nombre,
      idSucursal: e.id,
      pos: e.pos || 0,
      online: e.online || 0,
      offline: Math.max(0, (e.pos || 0) - (e.online || 0)),
      color: COLORS[i % COLORS.length],
    }));

    const LOCALES = allLocales.map((l, i) => ({
      id: i + 1,
      _id: l.id,
      company: l.empresaNombre,
      name: l.nombre,
      cod: l.id,
      pos: l.pos || 0,
      online: l.online || 0,
      offline: Math.max(0, (l.pos || 0) - (l.online || 0)),
      city: '',
    }));

    const DEVICES = allPos.map((p) => ({
      id: String(p.id),
      rustdeskId: p.id,
      company: p.empresaNombre,
      localCod: p._localId,
      ip: p.ip || '',
      version: p.version || '',
      status: p.estado === 'online' ? 'online' : 'offline',
      name: p.numero != null ? ('POS-' + p.numero) : p.id,
      lastSeen: p.ultimaActividadMin != null ? ('hace ' + p.ultimaActividadMin + ' min') : '',
    }));

    return { COMPANIES, LOCALES, DEVICES };
  }

  window.API = {
    getBaseURL, setBaseURL, getWSUrl,
    getToken, setToken, clearToken,
    login, me,
    createSession, deleteSession,
    createEmpresa, createLocal, createPos, deletePos,
    getNetworkData,
  };
})();
