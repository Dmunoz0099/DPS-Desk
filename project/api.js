// =============================================================
// DPS DESK — Cliente HTTP del backend
//
// Expone window.API. Mantiene los datos en la misma forma que
// window.MOCK (data.js) para que los componentes existentes
// (dashboard.jsx, network.jsx) no tengan que cambiar su acceso
// a window.MOCK.COMPANIES / .LOCALES / .DEVICES.
// =============================================================
(function () {
  const DEFAULT_BASE = 'http://localhost:4000';

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

  // Google OAuth Client ID — configurable desde la consola del navegador o
  // mediante el campo del login. Si el usuario no lo setea, se usa el default
  // de abajo (que el dueño del proyecto debe reemplazar por el suyo en Google Cloud).
  const DEFAULT_GOOGLE_CLIENT_ID = '744081716102-e92n23ser1vmspsf61gn3o2a9v1u4pj0.apps.googleusercontent.com';
  function getGoogleClientId() {
    try { return localStorage.getItem('DPS_GOOGLE_CLIENT_ID') || DEFAULT_GOOGLE_CLIENT_ID; }
    catch { return DEFAULT_GOOGLE_CLIENT_ID; }
  }
  function setGoogleClientId(id) {
    try { localStorage.setItem('DPS_GOOGLE_CLIENT_ID', id || ''); } catch {}
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
  async function loginWithGoogle(credential) {
    const r = await request('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });
    if (r && r.token) setToken(r.token);
    return r;
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
  // El backend exige los nombres exactos { id, nombre } / { id, empresa_id, nombre } /
  // { id, numero, local_id, empresa_id }. Aquí traducimos la forma "amistosa"
  // que usan los componentes (sucursalId, empresaId, codigo, rustdeskId) a esos
  // nombres canónicos para evitar 400s.
  async function createEmpresa(payload) {
    const body = {
      id: payload.id || payload.sucursalId,
      nombre: payload.nombre,
    };
    return request('/api/devices/empresas', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
  async function createLocal(payload) {
    const body = {
      id: payload.id || payload.codigo,
      empresa_id: payload.empresa_id || payload.empresaId,
      nombre: payload.nombre,
    };
    return request('/api/devices/locales', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
  async function createPos(payload) {
    const body = {
      id: payload.id || payload.rustdeskId,
      numero: payload.numero != null ? payload.numero : 1,
      local_id: payload.local_id || payload.localId,
      empresa_id: payload.empresa_id || payload.empresaId,
    };
    return request('/api/devices/pos', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
  async function deletePos(posId) {
    return request('/api/devices/pos/' + encodeURIComponent(posId), { method: 'DELETE' });
  }
  async function deleteLocal(localId) {
    return request('/api/devices/locales/' + encodeURIComponent(localId), { method: 'DELETE' });
  }
  async function deleteEmpresa(empresaId) {
    return request('/api/devices/empresas/' + encodeURIComponent(empresaId), { method: 'DELETE' });
  }
  async function updateEmpresa(empresaId, payload) {
    return request('/api/devices/empresas/' + encodeURIComponent(empresaId), {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }
  async function updateLocal(localId, payload) {
    return request('/api/devices/locales/' + encodeURIComponent(localId), {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }
  async function updatePos(posId, payload) {
    return request('/api/devices/pos/' + encodeURIComponent(posId), {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
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
      os: p.os || '',
      client: p.client || (p.version ? 'DPS Desk ' + p.version : ''),
      cpu: p.cpu ?? '—',
      ram: p.ram ?? '—',
      uptime: p.uptime || '—',
      latency: p.latency ?? '—',
    }));

    // Estructura jerárquica que consume la pantalla Network (v2).
    // Los contadores online/offline se recalculan a partir del estado en vivo
    // de cada DEVICE (que ahora refleja la conexión WS del agente en el backend),
    // no de los campos agregados del backend que pueden estar desactualizados.
    const COMPANIES_FULL = COMPANIES.map((c) => {
      let coOnline = 0, coTotal = 0;
      const locsForCo = LOCALES.filter((l) => l.company === c.name).map((l) => {
        const devs = DEVICES.filter((d) => d.company === c.name && d.localCod === l.cod);
        const onlineCount = devs.filter((d) => d.status === 'online').length;
        coOnline += onlineCount;
        coTotal += devs.length;
        return {
          id: c.name + '-' + l.cod,
          name: l.name,
          address: (l.city || '') + (l.cod ? ' · cod ' + l.cod : ''),
          total: devs.length,
          online: onlineCount,
          offline: devs.length - onlineCount,
          devices: devs,
        };
      });
      return {
        id: c.name,
        name: c.name,
        totalPos: coTotal,
        online: coOnline,
        offline: coTotal - coOnline,
        locations: locsForCo,
      };
    });

    return { COMPANIES, LOCALES, DEVICES, COMPANIES_FULL };
  }

  window.API = {
    getBaseURL, setBaseURL, getWSUrl,
    getToken, setToken, clearToken,
    getGoogleClientId, setGoogleClientId,
    login, me, loginWithGoogle,
    createSession, deleteSession,
    createEmpresa, createLocal, createPos, deletePos, deleteLocal, deleteEmpresa,
    updateEmpresa, updateLocal, updatePos,
    getNetworkData,
  };
})();
