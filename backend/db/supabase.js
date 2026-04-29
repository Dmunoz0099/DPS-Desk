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
const POS_SELECT = `
  *,
  empresa:empresa_id ( nombre ),
  local:local_id ( nombre )
`;

function formatPos(row) {
  if (!row) return null;
  return {
    id: row.id,
    numero: row.numero,
    localId: row.local_id,
    empresaId: row.empresa_id,
    estado: row.estado,
    ip: row.ip,
    version: row.version,
    empresaNombre: row.empresa?.nombre || '',
    localNombre: row.local?.nombre || '',
    hardware: {
      cpu: row.hardware_cpu,
      ram: row.hardware_ram,
      disco: row.hardware_disco,
      os: row.hardware_os,
    },
    ultimaActividadMin: row.ultima_actividad_min,
  };
}

async function getPosPorLocal(localId) {
  const { data, error } = await supabase
    .from('pos')
    .select(POS_SELECT)
    .eq('local_id', localId);
  if (error) throw error;
  return (data || []).map(formatPos);
}

async function getPosPorId(posId) {
  const { data, error } = await supabase
    .from('pos')
    .select(POS_SELECT)
    .eq('id', posId)
    .maybeSingle();
  if (error) throw error;
  return formatPos(data);
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
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function updateDeviceLastSeen(posId) {
  const { error } = await supabase
    .from('devices')
    .update({ last_seen: new Date().toISOString() })
    .eq('pos_id', posId);
  if (error) throw error;
}

// ── Inserts (empresas / locales / pos) ──────────────────────────────────────
async function createEmpresa({ id, nombre }) {
  const { data, error } = await supabase
    .from('empresas')
    .insert({ id, nombre })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function createLocal({ id, empresa_id, nombre }) {
  const { data, error } = await supabase
    .from('locales')
    .insert({ id, empresa_id, nombre })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function createPos(payload) {
  const allowed = [
    'id', 'numero', 'local_id', 'empresa_id', 'estado',
    'ip', 'version', 'hardware_cpu', 'hardware_ram', 'hardware_disco', 'hardware_os',
  ];
  const row = {};
  for (const k of allowed) if (payload[k] != null && payload[k] !== '') row[k] = payload[k];
  const { data, error } = await supabase.from('pos').insert(row).select().single();
  if (error) throw error;
  return data;
}

// ── Sessions ─────────────────────────────────────────────────────────────────
async function createSessionRow(sessionId, posId) {
  const { error } = await supabase.from('sessions').insert({
    id: sessionId,
    pos_id: posId,
    estado: 'iniciada',
  });
  if (error) throw error;
}

async function deleteSessionRow(sessionId) {
  const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
  if (error) throw error;
}

async function deleteSessionRowsOlderThan(isoCutoff) {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .lt('created_at', isoCutoff);
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
  createSessionRow,
  deleteSessionRow,
  deleteSessionRowsOlderThan,
  createEmpresa,
  createLocal,
  createPos,
};
