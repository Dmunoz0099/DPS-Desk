const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://wnfvoyhnxgtzqqtpjwbg.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseKey) {
  console.warn('[Supabase] SUPABASE_SERVICE_KEY not set, using SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey || process.env.SUPABASE_ANON_KEY);

// ── Empresas ─────────────────────────────────────────────────────────────────
async function getEmpresas() {
  const { data, error } = await supabase.from('empresas').select('*');
  if (error) throw error;
  return data || [];
}

async function getEmpresasConMetricas() {
  const empresas = await getEmpresas();
  for (const emp of empresas) {
    const { count } = await supabase
      .from('locales')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', emp.id);
    emp.locales = count || 0;

    const { count: posCount } = await supabase
      .from('pos')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', emp.id);
    emp.pos = posCount || 0;

    const { count: onlineCount } = await supabase
      .from('pos')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', emp.id)
      .eq('estado', 'online');
    emp.online = onlineCount || 0;
  }
  return empresas;
}

// ── Locales ──────────────────────────────────────────────────────────────────
async function getLocalesConMetricas(empresaId) {
  const { data, error } = await supabase
    .from('locales')
    .select('*')
    .eq('empresa_id', empresaId);
  if (error) throw error;

  for (const loc of data || []) {
    const { count } = await supabase
      .from('pos')
      .select('*', { count: 'exact', head: true })
      .eq('local_id', loc.id);
    loc.pos = count || 0;

    const { count: onlineCount } = await supabase
      .from('pos')
      .select('*', { count: 'exact', head: true })
      .eq('local_id', loc.id)
      .eq('estado', 'online');
    loc.online = onlineCount || 0;
  }
  return data || [];
}

// ── POS ──────────────────────────────────────────────────────────────────────
async function getPosPorLocal(localId) {
  const { data, error } = await supabase
    .from('pos')
    .select('*')
    .eq('local_id', localId);
  if (error) throw error;

  return (data || []).map(p => ({
    id: p.id,
    numero: p.numero,
    localId: p.local_id,
    empresaId: p.empresa_id,
    estado: p.estado,
    ip: p.ip,
    version: p.version,
    empresaNombre: 'EMPRESA DPS', // TODO: join
    localNombre: 'LOCAL 500',    // TODO: join
    hardware: {
      cpu: p.hardware_cpu,
      ram: p.hardware_ram,
      disco: p.hardware_disco,
      os: p.hardware_os,
    },
    ultimaActividadMin: p.ultima_actividad_min,
  }));
}

async function getPosPorId(posId) {
  const { data, error } = await supabase
    .from('pos')
    .select('*')
    .eq('id', posId)
    .single();
  if (error) throw error;

  if (!data) return null;

  return {
    id: data.id,
    numero: data.numero,
    localId: data.local_id,
    empresaId: data.empresa_id,
    estado: data.estado,
    ip: data.ip,
    version: data.version,
    empresaNombre: 'EMPRESA DPS',
    localNombre: 'LOCAL 500',
    hardware: {
      cpu: data.hardware_cpu,
      ram: data.hardware_ram,
      disco: data.hardware_disco,
      os: data.hardware_os,
    },
    ultimaActividadMin: data.ultima_actividad_min,
  };
}

async function getTotales() {
  const [empCount, locCount, posCount, onlineCount] = await Promise.all([
    supabase.from('empresas').select('*', { count: 'exact', head: true }).then(r => r.count || 0),
    supabase.from('locales').select('*', { count: 'exact', head: true }).then(r => r.count || 0),
    supabase.from('pos').select('*', { count: 'exact', head: true }).then(r => r.count || 0),
    supabase.from('pos').select('*', { count: 'exact', head: true }).eq('estado', 'online').then(r => r.count || 0),
  ]);

  return {
    empresas: empCount,
    locales: locCount,
    pos: posCount,
    posOnline: onlineCount,
  };
}

// ── Devices ──────────────────────────────────────────────────────────────────
async function registerDevice(posId, hostname, ip, os, version, screenWidth, screenHeight) {
  const { error } = await supabase.from('devices').upsert(
    {
      pos_id: posId,
      hostname,
      ip,
      os,
      version,
      screen_width: screenWidth,
      screen_height: screenHeight,
      last_seen: new Date().toISOString(),
    },
    { onConflict: 'pos_id' }
  );
  if (error) throw error;
}

async function getRegisteredDevices() {
  const { data, error } = await supabase.from('devices').select('*');
  if (error) throw error;
  return data || [];
}

async function getRegisteredDevice(posId) {
  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .eq('pos_id', posId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

async function updateDeviceLastSeen(posId) {
  const { error } = await supabase
    .from('devices')
    .update({ last_seen: new Date().toISOString() })
    .eq('pos_id', posId);
  if (error) throw error;
}

module.exports = {
  supabase,
  getEmpresas,
  getEmpresasConMetricas,
  getLocalesConMetricas,
  getPosPorLocal,
  getPosPorId,
  getTotales,
  registerDevice,
  getRegisteredDevices,
  getRegisteredDevice,
  updateDeviceLastSeen,
};
