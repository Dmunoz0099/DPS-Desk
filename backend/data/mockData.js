// Datos mock para DPSDESK. Estructura: empresas -> locales -> pos.
// Más adelante esto puede venir de una BD real (Postgres, Mongo, etc.)

const empresas = [
  { id: 'empresa-dps', nombre: 'EMPRESA DPS' },
];

const locales = [
  { id: 'local-500', empresaId: 'empresa-dps', nombre: 'LOCAL 500', codigo: 'Cod. 500' },
];

const pos = [
  {
    id: 'pos-89',
    numero: 89,
    localId: 'local-500',
    empresaId: 'empresa-dps',
    estado: 'online',
    ip: '192.168.1.103',
    version: '1.2.16',
    hardware: {
      cpu: 'Intel Core i5-12400',
      ram: '16 GB DDR4',
      disco: '512 GB SSD',
      os: 'Windows 11 Pro',
    },
    ultimaActividadMin: 2,
  },
];

// Calcula métricas online/offline para empresas y locales
function getEmpresasConMetricas() {
  return empresas.map((e) => {
    const localesDeEmpresa = locales.filter((l) => l.empresaId === e.id).map((l) => l.id);
    const posDeEmpresa = pos.filter((p) => localesDeEmpresa.includes(p.localId));
    return {
      ...e,
      online: posDeEmpresa.filter((p) => p.estado === 'online').length,
      offline: posDeEmpresa.filter((p) => p.estado === 'offline').length,
      totalLocales: localesDeEmpresa.length,
    };
  });
}

function getLocalesConMetricas(empresaId) {
  return locales
    .filter((l) => l.empresaId === empresaId)
    .map((l) => {
      const posDeLocal = pos.filter((p) => p.localId === l.id);
      return {
        ...l,
        online: posDeLocal.filter((p) => p.estado === 'online').length,
        offline: posDeLocal.filter((p) => p.estado === 'offline').length,
        total: posDeLocal.length,
      };
    });
}

function getPosPorLocal(localId) {
  const local = locales.find((l) => l.id === localId);
  if (!local) return [];
  const empresa = empresas.find((e) => e.id === local.empresaId);
  return pos
    .filter((p) => p.localId === localId)
    .map((p) => ({
      ...p,
      localNombre: local.nombre,
      empresaNombre: empresa ? empresa.nombre : '',
    }));
}

function getPosPorId(posId) {
  const p = pos.find((x) => x.id === posId);
  if (!p) return null;
  const local = locales.find((l) => l.id === p.localId);
  const empresa = empresas.find((e) => e.id === p.empresaId);
  return {
    ...p,
    localNombre: local ? local.nombre : '',
    empresaNombre: empresa ? empresa.nombre : '',
  };
}

function getTotales() {
  return {
    empresas: empresas.length,
    locales: locales.length,
    pos: pos.length,
    online: pos.filter((p) => p.estado === 'online').length,
    offline: pos.filter((p) => p.estado === 'offline').length,
  };
}

module.exports = {
  empresas,
  locales,
  pos,
  getEmpresasConMetricas,
  getLocalesConMetricas,
  getPosPorLocal,
  getPosPorId,
  getTotales,
};
