-- DPS Desk Schema para Supabase

-- Empresas
CREATE TABLE IF NOT EXISTS empresas (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  estado TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Locales
CREATE TABLE IF NOT EXISTS locales (
  id TEXT PRIMARY KEY,
  empresa_id TEXT REFERENCES empresas(id),
  nombre TEXT NOT NULL,
  estado TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- POS
CREATE TABLE IF NOT EXISTS pos (
  id TEXT PRIMARY KEY,
  numero INTEGER NOT NULL,
  local_id TEXT REFERENCES locales(id),
  empresa_id TEXT REFERENCES empresas(id),
  estado TEXT DEFAULT 'online',
  ip TEXT,
  version TEXT,
  hardware_cpu TEXT,
  hardware_ram TEXT,
  hardware_disco TEXT,
  hardware_os TEXT,
  ultima_actividad_min INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Devices Registrados (Electron apps)
-- pos_id es el UUID que el agente genera al instalarse; independiente de la tabla pos.
CREATE TABLE IF NOT EXISTS devices (
  pos_id TEXT PRIMARY KEY,
  hostname TEXT,
  ip TEXT,
  os TEXT,
  version TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions (WebRTC)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  pos_id TEXT,
  estado TEXT DEFAULT 'iniciada',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_locales_empresa ON locales(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pos_local ON pos(local_id);
CREATE INDEX IF NOT EXISTS idx_pos_empresa ON pos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_sessions_pos ON sessions(pos_id);
CREATE INDEX IF NOT EXISTS idx_devices_pos ON devices(pos_id);
