// Mock data for DPS DESK prototype
const COMPANIES = [
  { name: 'BARRIO SALUD',   idSucursal: '1048', pos: 45, online: 43, offline: 2, color: '#6366f1' },
  { name: 'Farmacia ESPOZ', idSucursal: '1067', pos: 13, online: 11, offline: 2, color: '#0ea5e9' },
  { name: 'Farmacia SANTI', idSucursal: '1052', pos: 5,  online: 3,  offline: 2, color: '#10b981' },
  { name: 'FARMAZ',         idSucursal: '1044', pos: 5,  online: 4,  offline: 1, color: '#f59e0b' },
];

const LOCALES = [
  { id: 1,  company: 'Farmacia ESPOZ', name: 'LA ESTRELLA',     cod: '002', pos: 3, online: 2, offline: 1, city: 'Santiago' },
  { id: 2,  company: 'Farmacia ESPOZ', name: 'NEPTUNO',         cod: '003', pos: 2, online: 2, offline: 0, city: 'Santiago' },
  { id: 3,  company: 'Farmacia ESPOZ', name: 'PAJARITO',        cod: '004', pos: 2, online: 2, offline: 0, city: 'Maipú' },
  { id: 4,  company: 'Farmacia ESPOZ', name: 'ALAMEDA',         cod: '009', pos: 2, online: 1, offline: 1, city: 'Santiago' },
  { id: 5,  company: 'Farmacia ESPOZ', name: 'SANTA ROSA',      cod: '017', pos: 2, online: 2, offline: 0, city: 'Santiago' },
  { id: 6,  company: 'Farmacia ESPOZ', name: 'LOURDES',         cod: '018', pos: 2, online: 2, offline: 0, city: 'Estación' },
  { id: 7,  company: 'BARRIO SALUD',   name: 'ISABEL RIQUELME', cod: '1',   pos: 5, online: 5, offline: 0, city: 'Concepción' },
  { id: 8,  company: 'BARRIO SALUD',   name: 'TOMÉ',            cod: '2',   pos: 3, online: 3, offline: 0, city: 'Tomé' },
  { id: 9,  company: 'BARRIO SALUD',   name: 'ARAUCO 3',        cod: '3',   pos: 5, online: 5, offline: 0, city: 'Arauco' },
  { id: 10, company: 'BARRIO SALUD',   name: '5 DE ABRIL',      cod: '4',   pos: 6, online: 6, offline: 0, city: 'Concepción' },
  { id: 11, company: 'BARRIO SALUD',   name: 'RENGO',           cod: '5',   pos: 3, online: 3, offline: 0, city: 'Rengo' },
  { id: 12, company: 'Farmacia SANTI', name: 'FSANTI',          cod: '1',   pos: 3, online: 3, offline: 0, city: 'Valparaíso' },
  { id: 13, company: 'Farmacia SANTI', name: 'LOCAL 500',       cod: '500', pos: 1, online: 0, offline: 1, city: 'Viña' },
  { id: 14, company: 'FARMAZ',         name: 'SANTA LUCIA',     cod: '1',   pos: 5, online: 4, offline: 1, city: 'Santiago' },
];

const DEVICES = [
  // BARRIO SALUD - ISABEL RIQUELME (cod: 1)
  { id: '1', rustdeskId: '928 341 001', company: 'BARRIO SALUD', localCod: '1', ip: '192.168.1.13', version: '1.2.16', status: 'online', name: 'POS-001', lastSeen: 'hace 12s' },
  { id: '4', rustdeskId: '928 341 004', company: 'BARRIO SALUD', localCod: '1', ip: '192.168.1.20', version: '1.2.16', status: 'online', name: 'POS-004', lastSeen: 'hace 8s' },
  { id: '3', rustdeskId: '928 341 003', company: 'BARRIO SALUD', localCod: '1', ip: '192.168.1.18', version: '1.2.16', status: 'online', name: 'POS-003', lastSeen: 'hace 24s' },
  { id: '2', rustdeskId: '928 341 002', company: 'BARRIO SALUD', localCod: '1', ip: '192.168.1.15', version: '1.2.15', status: 'online', name: 'POS-002', lastSeen: 'hace 42s' },
  { id: '5', rustdeskId: '928 341 005', company: 'BARRIO SALUD', localCod: '1', ip: '192.168.1.22', version: '1.2.16', status: 'online', name: 'POS-005', lastSeen: 'hace 5s' },

  // Farmacia ESPOZ - LA ESTRELLA (cod: 002)
  { id: '10', rustdeskId: '110 220 010', company: 'Farmacia ESPOZ', localCod: '002', ip: '10.0.5.10', version: '1.2.16', status: 'online',  name: 'POS-CAJA-1', lastSeen: 'hace 10s' },
  { id: '11', rustdeskId: '110 220 011', company: 'Farmacia ESPOZ', localCod: '002', ip: '10.0.5.11', version: '1.2.16', status: 'online',  name: 'POS-CAJA-2', lastSeen: 'hace 18s' },
  { id: '12', rustdeskId: '110 220 012', company: 'Farmacia ESPOZ', localCod: '002', ip: '10.0.5.12', version: '1.2.13', status: 'offline', name: 'POS-CAJA-3', lastSeen: 'hace 3h' },

  // Farmacia ESPOZ - NEPTUNO (cod: 003)
  { id: '13', rustdeskId: '110 220 013', company: 'Farmacia ESPOZ', localCod: '003', ip: '10.0.6.10', version: '1.2.16', status: 'online', name: 'POS-CAJA-1', lastSeen: 'hace 4s' },
  { id: '14', rustdeskId: '110 220 014', company: 'Farmacia ESPOZ', localCod: '003', ip: '10.0.6.11', version: '1.2.16', status: 'online', name: 'POS-CAJA-2', lastSeen: 'hace 22s' },

  // Farmacia SANTI - LOCAL 500 (cod: 500)
  { id: '20', rustdeskId: '500 100 020', company: 'Farmacia SANTI', localCod: '500', ip: '172.16.4.5', version: '1.2.10', status: 'offline', name: 'POS-PRINCIPAL', lastSeen: 'hace 2d' },

  // FARMAZ - SANTA LUCIA (cod: 1)
  { id: '30', rustdeskId: '404 808 030', company: 'FARMAZ', localCod: '1', ip: '192.168.7.10', version: '1.2.16', status: 'online',  name: 'POS-VENTA-1', lastSeen: 'hace 14s' },
  { id: '31', rustdeskId: '404 808 031', company: 'FARMAZ', localCod: '1', ip: '192.168.7.11', version: '1.2.16', status: 'online',  name: 'POS-VENTA-2', lastSeen: 'hace 9s' },
  { id: '32', rustdeskId: '404 808 032', company: 'FARMAZ', localCod: '1', ip: '192.168.7.12', version: '1.2.16', status: 'online',  name: 'POS-VENTA-3', lastSeen: 'hace 31s' },
  { id: '33', rustdeskId: '404 808 033', company: 'FARMAZ', localCod: '1', ip: '192.168.7.13', version: '1.2.15', status: 'online',  name: 'POS-VENTA-4', lastSeen: 'hace 55s' },
  { id: '34', rustdeskId: '404 808 034', company: 'FARMAZ', localCod: '1', ip: '192.168.7.14', version: '1.2.13', status: 'offline', name: 'POS-FARMA',   lastSeen: 'hace 12h' },
];

// Recent events / activity log
const EVENTS = [
  { t: 'hace 2 min',  type: 'connect',     who: 'BARRIO SALUD / ISABEL RIQUELME / POS-003',     by: 'tech.lopez' },
  { t: 'hace 8 min',  type: 'offline',     who: 'Farmacia SANTI / LOCAL 500 / POS-PRINCIPAL',  level: 'err' },
  { t: 'hace 14 min', type: 'transfer',    who: 'BARRIO SALUD / TOMÉ / POS-002',                by: 'admin' },
  { t: 'hace 22 min', type: 'reconnect',   who: 'Farmacia ESPOZ / LA ESTRELLA / POS-CAJA-1',    level: 'ok' },
  { t: 'hace 31 min', type: 'connect',     who: 'FARMAZ / SANTA LUCIA / POS-VENTA-2',           by: 'soporte' },
  { t: 'hace 1 h',    type: 'update',      who: 'Farmacia ESPOZ / NEPTUNO / POS-CAJA-2',        by: 'admin', detail: 'cliente RustDesk 1.2.16' },
  { t: 'hace 1 h',    type: 'offline',     who: 'Farmacia ESPOZ / LA ESTRELLA / POS-CAJA-3',   level: 'warn' },
  { t: 'hace 2 h',    type: 'login',       who: 'paula.rios@digitalpharma.cl', detail: 'desde 200.45.12.x' },
];

// 24h connectivity series — for sparkline / chart
const CONN_SERIES = Array.from({ length: 24 }, (_, i) => {
  const base = 92;
  const noise = Math.sin(i * 0.7) * 3 + Math.cos(i * 1.3) * 2;
  const dip = i === 14 || i === 15 ? -8 : 0;
  return Math.max(70, Math.min(100, Math.round(base + noise + dip)));
});

// Build nested COMPANIES_FULL for the Network screen (3-level drill-down)
const COMPANIES_FULL = COMPANIES.map(c => {
  const locs = LOCALES.filter(l => l.company === c.name).map(l => {
    const devs = DEVICES.filter(d => d.company === c.name && d.localCod === l.cod);
    // pad with synthesized devices if real data thin
    const synthesized = [];
    while (devs.length + synthesized.length < l.pos) {
      const idx = devs.length + synthesized.length + 1;
      const isOff = synthesized.length < l.offline - devs.filter(d=>d.status==='offline').length;
      synthesized.push({
        id: `${l.id}-syn-${idx}`,
        rustdeskId: `${(900 + l.id*7).toString().slice(0,3)} ${(100 + idx*11).toString().slice(0,3)} ${(idx*13).toString().padStart(3,'0').slice(0,3)}`,
        company: c.name, localCod: l.cod,
        ip: `10.0.${l.id}.${10+idx}`,
        version: '1.2.16',
        status: isOff ? 'offline' : (idx === 1 ? 'online' : (idx % 4 === 0 ? 'idle' : 'online')),
        name: `POS-${String(idx).padStart(2,'0')}`,
        lastSeen: isOff ? 'hace 2 h' : `hace ${10 + idx*4}s`,
      });
    }
    const allDevs = [...devs, ...synthesized].map(d => ({
      ...d,
      os: d.os || (Math.random() > 0.7 ? 'Windows 11 Pro' : 'Windows 10 Pro'),
      client: d.client || `RustDesk ${d.version}`,
      cpu: d.cpu ?? (d.status === 'offline' ? '—' : Math.floor(8 + Math.random()*22)),
      ram: d.ram ?? (d.status === 'offline' ? '—' : (4 + Math.floor(Math.random()*5))),
      uptime: d.uptime || (d.status === 'offline' ? '—' : `${Math.floor(2 + Math.random()*22)}d`),
      latency: d.latency ?? (d.status === 'offline' ? '—' : (20 + Math.floor(Math.random()*60))),
    }));
    return {
      id: `${c.name}-${l.cod}`,
      name: l.name,
      address: `${l.city} · cod ${l.cod}`,
      total: l.pos,
      online: l.online,
      offline: l.offline,
      devices: allDevs,
    };
  });
  return {
    id: c.name,
    name: c.name,
    totalPos: c.pos,
    online: c.online,
    offline: c.offline,
    locations: locs,
  };
});

window.MOCK = { COMPANIES, LOCALES, DEVICES, EVENTS, CONN_SERIES, COMPANIES_FULL };
