// Cliente API simple.
// En Electron: usa window.__DPSDESK_CONFIG__.backendUrl (inyectado por preload)
// En navegador: fallback a /api (Vite proxea a http://localhost:4000)
const cfg = typeof window !== 'undefined' ? window.__DPSDESK_CONFIG__ : {};
const BASE = cfg?.backendUrl ? `${cfg.backendUrl}/api` : '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

export const api = {
  getResumen: () => request('/devices'),
  getEmpresas: () => request('/devices/empresas'),
  getLocales: (empresaId) => request(`/devices/empresas/${empresaId}/locales`),
  getPosPorLocal: (localId) => request(`/devices/locales/${localId}/pos`),
  getPos: (posId) => request(`/devices/pos/${posId}`),
  crearSesion: (posId) =>
    request('/sessions', {
      method: 'POST',
      body: JSON.stringify({ posId }),
    }),
  terminarSesion: (sessionId) =>
    request(`/sessions/${sessionId}`, { method: 'DELETE' }).catch(() => {}),
  getAgentStatus: (posId) => request(`/agents/${posId}`),
};
