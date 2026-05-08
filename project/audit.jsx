/* global React */
const { useState, useMemo } = React;

// =============================================================
// AuditScreen — registro de actividad del panel.
//
// Hoy lee window.MOCK.EVENTS (vacío hasta que el backend exponga el endpoint
// de auditoría). Se sintetizan filas a partir del estado actual de DEVICES
// para que la pantalla nunca quede vacía mientras el endpoint se construye.
// =============================================================
function AuditScreen({ profile }) {
  const [filter, setFilter] = useState('all');
  const [query, setQuery]   = useState('');

  const rows = useMemo(() => buildRows(profile), [profile]);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (filter !== 'all' && r.cat !== filter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        r.event.toLowerCase().includes(q) ||
        r.actor.toLowerCase().includes(q) ||
        (r.detail || '').toLowerCase().includes(q)
      );
    });
  }, [rows, filter, query]);

  const cats = [
    { id: 'all',     label: 'Todo',        count: rows.length },
    { id: 'session', label: 'Sesiones',    count: rows.filter(r => r.cat === 'session').length },
    { id: 'device',  label: 'Dispositivos', count: rows.filter(r => r.cat === 'device').length },
    { id: 'auth',    label: 'Acceso',      count: rows.filter(r => r.cat === 'auth').length },
    { id: 'config',  label: 'Configuración', count: rows.filter(r => r.cat === 'config').length },
  ];

  const exportCsv = () => {
    const header = 'timestamp,event,actor,target,detail,category';
    const body = filtered.map(r =>
      [r.t, r.event, r.actor, r.target || '', (r.detail || '').replace(/[\r\n,]/g, ' '), r.cat].join(',')
    ).join('\n');
    const csv = header + '\n' + body;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dpsdesk-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fade-in" style={{ padding: '16px 28px 56px', maxWidth: 1280 }}>
      {/* Top controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240, maxWidth: 380 }}>
          <Icon name="search" size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-soft)' }}/>
          <input
            className="input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por evento, actor o detalle…"
            style={{ paddingLeft: 36, height: 38, fontSize: 13 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {cats.map(c => (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className="btn btn-sm"
              style={{
                background: filter === c.id ? 'var(--ink)' : 'transparent',
                color: filter === c.id ? 'var(--paper)' : 'var(--ink-mute)',
                borderColor: filter === c.id ? 'var(--ink)' : 'var(--line-2)',
                fontWeight: filter === c.id ? 600 : 500,
              }}
            >
              {c.label}
              <span className="mono" style={{
                marginLeft: 8, fontSize: 10,
                color: filter === c.id ? 'var(--lime)' : 'var(--ink-soft)',
              }}>{c.count}</span>
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }}/>
        <button className="btn btn-sm" onClick={exportCsv}>
          <Icon name="download" size={12}/> Exportar CSV
        </button>
      </div>

      {/* Stat band */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        <StatCell label="Total registrado" value={rows.length} hint="Últimas 24 h" tone="ink"/>
        <StatCell label="Sesiones remotas" value={rows.filter(r => r.cat === 'session').length} hint="Conexiones a POS" tone="plum"/>
        <StatCell label="Eventos críticos" value={rows.filter(r => r.tone === 'bad').length} hint="Requieren atención" tone="bad"/>
        <StatCell label="Retención" value="12 m" hint="Política actual" tone="lime"/>
      </div>

      {/* Logs table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="row" style={{
          gridTemplateColumns: '120px 1fr 200px 200px 90px',
          background: 'var(--paper-2)', height: 42, padding: '0 22px',
        }}>
          <span className="serial" style={{ fontSize: 10 }}>Hora</span>
          <span className="serial" style={{ fontSize: 10 }}>Evento</span>
          <span className="serial" style={{ fontSize: 10 }}>Actor</span>
          <span className="serial" style={{ fontSize: 10 }}>Objetivo</span>
          <span className="serial" style={{ fontSize: 10, textAlign: 'right' }}>Estado</span>
        </div>
        {filtered.length === 0 && (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--paper-2)', margin: '0 auto 14px', display: 'grid', placeItems: 'center', color: 'var(--ink-mute)' }}>
              <Icon name="history" size={22}/>
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>Sin registros que coincidan</div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 6, letterSpacing: '0.04em' }}>
              {query ? 'Ajusta el filtro o limpia la búsqueda.' : 'Aún no hay actividad en esta categoría.'}
            </div>
          </div>
        )}
        {filtered.map((r, i) => (
          <div key={i} className="row" style={{
            gridTemplateColumns: '120px 1fr 200px 200px 90px',
            height: 52, padding: '0 22px',
            borderTop: '1px solid var(--line)',
          }}>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{r.t}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{r.event}</div>
              {r.detail && (
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.detail}
                </div>
              )}
            </div>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{r.actor}</span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.target || '—'}</span>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <span className={`chip ${chipClassFor(r.tone)}`} style={{ fontSize: 10, padding: '4px 10px', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
                {labelFor(r.tone)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mono" style={{ marginTop: 22, fontSize: 10, color: 'var(--ink-soft)', letterSpacing: '0.06em' }}>
        Los registros se conservan 12 meses. Los eventos del backend aparecerán aquí en cuanto la API
        de auditoría esté disponible.
      </div>
    </div>
  );
}

function StatCell({ label, value, hint, tone }) {
  const accent = tone === 'lime' ? 'var(--lime)' :
                 tone === 'plum' ? 'var(--plum)' :
                 tone === 'bad'  ? 'var(--bad)'  : 'var(--ink)';
  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="serial" style={{ fontSize: 10, marginBottom: 10 }}>{label}</div>
      <div className="display num" style={{ fontSize: 32, lineHeight: 1, color: accent, letterSpacing: '-0.02em' }}>{value}</div>
      <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', marginTop: 8 }}>{hint}</div>
    </div>
  );
}

function chipClassFor(tone) {
  if (tone === 'good') return 'good';
  if (tone === 'bad')  return 'bad';
  if (tone === 'warn') return 'warn';
  return 'plum';
}
function labelFor(tone) {
  if (tone === 'good') return 'OK';
  if (tone === 'bad')  return 'ALERTA';
  if (tone === 'warn') return 'AVISO';
  return 'INFO';
}

// Sintetiza filas razonables a partir del estado actual del sistema —
// la idea es que el panel siempre tenga algo coherente mostrando.
function buildRows(profile) {
  const now = new Date();
  const fmt = (offsetMin) => {
    const d = new Date(now.getTime() - offsetMin * 60_000);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };
  const me = profile?.email || 'sistema';
  const events = (window.MOCK && window.MOCK.EVENTS) || [];
  const devices = (window.MOCK && window.MOCK.DEVICES) || [];

  const rows = [];

  // 1. Si el backend ya entregó EVENTS, los usamos tal cual.
  events.forEach((e, i) => {
    rows.push({
      t: e.t || fmt(i * 3),
      event: e.event || e.title || 'evento',
      actor: e.actor || me,
      target: e.target || '',
      detail: e.detail || e.desc || '',
      cat: e.cat || 'session',
      tone: e.tone || 'good',
    });
  });

  // 2. Snapshot de dispositivos online/offline como evento "device.heartbeat".
  devices.slice(0, 6).forEach((d, i) => {
    rows.push({
      t: fmt(8 + i * 4),
      event: d.status === 'online' ? 'device.online' : 'device.offline',
      actor: 'agent',
      target: `${d.name} · ${d.company}`,
      detail: d.status === 'online'
        ? `latencia ${d.latency || '—'} ms · uptime ${d.uptime || '—'}`
        : `último heartbeat ${d.lastSeen || '—'}`,
      cat: 'device',
      tone: d.status === 'online' ? 'good' : 'bad',
    });
  });

  // 3. Eventos sintéticos del propio panel — login, navegación.
  rows.push({ t: fmt(0),  event: 'auth.session.refresh', actor: me, target: 'panel',  detail: 'token JWT renovado', cat: 'auth',    tone: 'good' });
  rows.push({ t: fmt(1),  event: 'panel.navigate',       actor: me, target: 'audit',  detail: 'ruta /audit',         cat: 'config',  tone: 'plum' });
  rows.push({ t: fmt(28), event: 'auth.login.success',   actor: me, target: 'panel',  detail: 'oauth · google',      cat: 'auth',    tone: 'good' });

  // Ordenar más recientes primero
  rows.sort((a, b) => (a.t < b.t ? 1 : -1));
  return rows;
}

window.AuditScreen = AuditScreen;
