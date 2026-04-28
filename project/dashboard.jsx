/* global React */
const { useState, useMemo } = React;

function Sparkline({ data, color = 'var(--accent-600)', height = 40, fill = true }) {
  const w = 200, h = height, p = 4;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = p + (i / (data.length - 1)) * (w - p * 2);
    const y = p + (1 - (v - min) / range) * (h - p * 2);
    return [x, y];
  });
  const path = pts.map((pt, i) => (i === 0 ? 'M' : 'L') + pt[0].toFixed(1) + ',' + pt[1].toFixed(1)).join(' ');
  const areaPath = path + ` L${pts[pts.length-1][0]},${h} L${pts[0][0]},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="spark" style={{ height }}>
      {fill && (
        <>
          <defs>
            <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
              <stop offset="100%" stopColor={color} stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#sparkfill)"/>
        </>
      )}
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function StatCard({ label, value, delta, deltaTone = 'ok', spark, icon, footer }) {
  return (
    <div className="card card-hover" style={{ padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--fg-muted)' }}>
        {icon && <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--surface-2)', display: 'grid', placeItems: 'center' }}><Icon name={icon} size={13}/></div>}
        <span style={{ fontSize: 12, fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 14 }}>
        <span className="num" style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1 }}>{value}</span>
        {delta && (
          <span className={`chip ${deltaTone}`} style={{ padding: '2px 7px', fontSize: 11 }}>{delta}</span>
        )}
      </div>
      {spark && <div style={{ marginTop: 12 }}>{spark}</div>}
      {footer && <div style={{ marginTop: 10, fontSize: 11, color: 'var(--fg-subtle)' }}>{footer}</div>}
    </div>
  );
}

function DashboardScreen({ onNavigate }) {
  const { COMPANIES, EVENTS, CONN_SERIES, DEVICES, LOCALES } = window.MOCK;

  const totalPos = DEVICES.length;
  const online = DEVICES.filter(d => d.status === 'online').length;
  const offline = totalPos - online;
  const uptimePct = ((online / totalPos) * 100).toFixed(1);

  // Top companies by offline
  const offlineByCompany = COMPANIES.map(c => ({ ...c, _ratio: c.offline / c.pos })).sort((a,b) => b._ratio - a._ratio);

  return (
    <div className="fade-in" style={{ padding: '24px 28px 60px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Visión general</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--fg-muted)' }}>
            Estado de la red en tiempo real · actualizado hace 4 segundos
          </p>
        </div>
        <div className="segmented">
          <button data-active="false">1h</button>
          <button data-active="true">24h</button>
          <button data-active="false">7d</button>
          <button data-active="false">30d</button>
        </div>
        <button className="btn">
          <Icon name="download" size={13}/> Exportar
        </button>
        <button className="btn btn-primary" onClick={() => onNavigate('network')}>
          <Icon name="zap" size={13}/> Conexión rápida
        </button>
      </div>

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 14 }}>
        <StatCard label="Total POS" value={totalPos} icon="laptop" delta="+2 esta semana" deltaTone="accent" spark={<Sparkline data={CONN_SERIES.map(v => v + 4)} color="var(--accent-600)"/>}/>
        <StatCard label="En línea" value={online} icon="activity" delta={`${uptimePct}%`} deltaTone="ok" spark={<Sparkline data={CONN_SERIES} color="var(--ok)"/>}/>
        <StatCard label="Desconectados" value={offline} icon="bell0" delta={offline > 0 ? `${offline} alertas` : 'sin alertas'} deltaTone="err" spark={<Sparkline data={CONN_SERIES.map(v => 100 - v)} color="var(--err)"/>}/>
        <StatCard label="Sesiones activas" value="3" icon="terminal" delta="2 técnicos" deltaTone="accent" footer="Promedio diario: 142 sesiones · 38 ms latencia"/>
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
        {/* Connectivity chart */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Conectividad de la red</h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>% de POS en línea — últimas 24 horas</p>
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--fg-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 2, background: 'var(--accent-600)' }}/>Conectividad
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--err)' }}/>Incidencia 14:00
              </span>
            </div>
          </div>
          {/* Big chart — built inline */}
          <BigChart data={CONN_SERIES}/>
        </div>

        {/* Empresas summary */}
        <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Empresas</h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Salud por organización</p>
            </div>
            <button className="btn btn-sm btn-ghost" onClick={() => onNavigate('network')}>Ver todas <Icon name="chevronR" size={12}/></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
            {offlineByCompany.map(c => {
              const pct = (c.online / c.pos) * 100;
              const tone = c._ratio > 0.2 ? 'err' : c._ratio > 0.1 ? 'warn' : 'ok';
              return (
                <div key={c.name}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: c.color }}/>
                    <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{c.name}</span>
                    <span className="num" style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                      <span style={{ color: 'var(--fg)', fontWeight: 600 }}>{c.online}</span>
                      /{c.pos}
                    </span>
                  </div>
                  <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${pct}%`, background: tone === 'ok' ? 'var(--ok)' : tone === 'warn' ? 'var(--warn)' : 'var(--err)', transition: 'width 600ms ease' }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lower row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14, marginTop: 14 }}>
        {/* Activity feed */}
        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border)' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Actividad reciente</h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Eventos de toda la red</p>
            </div>
            <div className="segmented">
              <button data-active="true">Todo</button>
              <button data-active="false">Conexiones</button>
              <button data-active="false">Alertas</button>
            </div>
          </div>
          <div>
            {EVENTS.map((e, i) => {
              const meta = {
                connect:   { icon: 'arrowRt', tone: 'accent', label: 'Sesión iniciada' },
                offline:   { icon: 'bell0',   tone: e.level === 'warn' ? 'warn' : 'err', label: 'Dispositivo offline' },
                transfer:  { icon: 'file',    tone: 'accent', label: 'Transferencia' },
                reconnect: { icon: 'refresh', tone: 'ok',     label: 'Reconectado' },
                update:    { icon: 'download',tone: 'accent', label: 'Actualización' },
                login:     { icon: 'user',    tone: 'accent', label: 'Inicio de sesión' },
              }[e.type];
              return (
                <div key={i} style={{ padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: i < EVENTS.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: meta.tone === 'err' ? 'var(--err-bg)' : meta.tone === 'warn' ? 'var(--warn-bg)' : meta.tone === 'ok' ? 'var(--ok-bg)' : 'var(--accent-50)',
                    color: meta.tone === 'err' ? 'var(--err)' : meta.tone === 'warn' ? 'var(--warn)' : meta.tone === 'ok' ? 'var(--ok)' : 'var(--accent-700)',
                    display: 'grid', placeItems: 'center', flexShrink: 0,
                  }}>
                    <Icon name={meta.icon} size={14}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{meta.label}</div>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.who}{e.detail ? ` · ${e.detail}` : ''}{e.by ? ` · ${e.by}` : ''}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--fg-subtle)', flexShrink: 0 }}>{e.t}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick actions / alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Alert card */}
          <div className="card" style={{ padding: 18, borderColor: 'color-mix(in oklab, var(--err) 30%, var(--border))' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--err-bg)', color: 'var(--err)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Icon name="bell0" size={14}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>2 dispositivos sin conexión &gt; 1h</div>
                <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 4, lineHeight: 1.5 }}>
                  POS-CAJA-3 (LA ESTRELLA) y POS-PRINCIPAL (LOCAL 500) llevan más de 1 hora sin reportar heartbeat.
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                  <button className="btn btn-sm btn-primary">Investigar</button>
                  <button className="btn btn-sm">Silenciar 1h</button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick connect */}
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Conexión rápida</h3>
            <p style={{ margin: '2px 0 14px', fontSize: 12, color: 'var(--fg-muted)' }}>Pega un ID RustDesk o busca por nombre</p>
            <div style={{ display: 'flex', gap: 6 }}>
              <input className="input mono" placeholder="ID RustDesk · ej. 928 341 003" style={{ height: 36, fontSize: 12 }}/>
              <button className="btn btn-primary"><Icon name="arrowRt" size={13}/></button>
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: 'var(--fg-subtle)' }}>Recientes</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
              {DEVICES.slice(0, 3).map(d => (
                <button key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, fontSize: 12, color: 'var(--fg-muted)', cursor: 'pointer' }}>
                  <span className={`status-dot ${d.status === 'online' ? 'ok' : 'err'}`}/>
                  <span className="mono">{d.rustdeskId}</span>
                  <span style={{ color: 'var(--fg-subtle)', fontSize: 11 }}>· {d.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Big stylized chart
function BigChart({ data }) {
  const w = 800, h = 220, pl = 32, pr = 14, pt = 14, pb = 26;
  const min = 60, max = 100;
  const xStep = (w - pl - pr) / (data.length - 1);
  const pts = data.map((v, i) => [pl + i * xStep, pt + (1 - (v - min)/(max - min)) * (h - pt - pb)]);
  const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const area = path + ` L${pts[pts.length-1][0]},${h - pb} L${pts[0][0]},${h - pb} Z`;
  // mark dip
  const dipIdx = data.indexOf(Math.min(...data));
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 220 }}>
      <defs>
        <linearGradient id="bigfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent-500)" stopOpacity="0.28"/>
          <stop offset="100%" stopColor="var(--accent-500)" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {/* grid */}
      {[0, 0.25, 0.5, 0.75, 1].map(t => {
        const y = pt + t * (h - pt - pb);
        const v = max - t * (max - min);
        return (
          <g key={t}>
            <line x1={pl} y1={y} x2={w - pr} y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray={t === 1 ? '0' : '3 3'}/>
            <text x={pl - 8} y={y + 3} textAnchor="end" fontSize="10" fill="var(--fg-subtle)">{Math.round(v)}%</text>
          </g>
        );
      })}
      {/* x labels */}
      {[0, 6, 12, 18, 23].map(i => (
        <text key={i} x={pl + i * xStep} y={h - 8} fontSize="10" fill="var(--fg-subtle)" textAnchor="middle">{String(i).padStart(2,'0')}:00</text>
      ))}
      <path d={area} fill="url(#bigfill)"/>
      <path d={path} fill="none" stroke="var(--accent-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {/* dip marker */}
      <circle cx={pts[dipIdx][0]} cy={pts[dipIdx][1]} r="5" fill="var(--surface)" stroke="var(--err)" strokeWidth="2"/>
      <circle cx={pts[dipIdx][0]} cy={pts[dipIdx][1]} r="10" fill="var(--err)" opacity="0.15"/>
    </svg>
  );
}

window.DashboardScreen = DashboardScreen;
