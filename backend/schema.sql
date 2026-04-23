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
CREATE TABLE IF NOT EXISTS devices (
  pos_id TEXT PRIMARY KEY REFERENCES pos(id),
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
  pos_id TEXT REFERENCES pos(id),
  estado TEXT DEFAULT 'iniciada',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Datos iniciales
INSERT INTO empresas (id, nombre) VALUES
  ('empresa-dps', 'EMPRESA DPS')
  ON CONFLICT DO NOTHING;

INSERT INTO locales (id, empresa_id, nombre) VALUES
  ('local-500', 'empresa-dps', 'LOCAL 500')
  ON CONFLICT DO NOTHING;

INSERT INTO pos (id, numero, local_id, empresa_id, ip, version, hardware_os) VALUES
  ('pos-89', 89, 'local-500', 'empresa-dps', '192.168.1.103', '1.2.16', 'Windows 11 Pro')
  ON CONFLICT DO NOTHING;

-- Índices
CREATE INDEX IF NOT EXISTS idx_locales_empresa ON locales(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pos_local ON pos(local_id);
CREATE INDEX IF NOT EXISTS idx_pos_empresa ON pos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_sessions_pos ON sessions(pos_id);
CREATE INDEX IF NOT EXISTS idx_devices_pos ON devices(pos_id);
