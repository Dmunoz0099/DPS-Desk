/* global React */
const { useMemo, useState, useEffect, useRef } = React;

// ---- Connectivity series generator -------------------------------------------------
// Returns { series, point(i), xTicks } for a given range.
// `series` is uptime % per bucket. `point(i)` returns metadata for hover tooltips.
// `xTicks` is the sparse list of axis labels.
function buildConnSeries(range, seed = 0) {
  const cfgs = {
    '1h':  { len: 60, bucketMs: 60_000,           base: 94, jitter: 1.4, dip: { idx: 42, depth: 5 } },
    '24h': { len: 24, bucketMs: 60 * 60_000,      base: 92, jitter: 2.6, dip: { idx: 14, depth: 8 } },
    '7d':  { len: 7,  bucketMs: 24 * 60 * 60_000, base: 91, jitter: 3.2, dip: { idx: 4,  depth: 7 } },
    '30d': { len: 30, bucketMs: 24 * 60 * 60_000, base: 91, jitter: 3.6, dip: { idx: 22, depth: 9 } },
  };
  const c = cfgs[range];
  const now = Date.now();

  const series = Array.from({ length: c.len }, (_, i) => {
    const noise = Math.sin((i + seed * 0.13) * 0.7) * c.jitter
                + Math.cos((i + seed * 0.07) * 1.3) * (c.jitter * 0.55);
    const dipAdj = (i === c.dip.idx || i === c.dip.idx + 1) ? -c.dip.depth : 0;
    const trail = i === c.len - 1 ? (Math.sin(seed * 0.9) * 0.6) : 0; // last point wiggles on refresh
    const v = c.base + noise + dipAdj + trail;
    return Math.max(70, Math.min(100, Math.round(v * 10) / 10));
  });

  const point = (i) => {
    const t = new Date(now - (c.len - 1 - i) * c.bucketMs);
    const pad = (n) => String(n).padStart(2, '0');
    let label;
    if (range === '1h')       label = `${pad(t.getHours())}:${pad(t.getMinutes())}`;
    else if (range === '24h') label = `${pad(t.getHours())}:00`;
    else if (range === '7d')  label = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][t.getDay()];
    else /* 30d */            label = `${pad(t.getDate())}.${pad(t.getMonth() + 1)}`;
    return { value: series[i], label, time: t };
  };

  let xTicks;
  if (range === '1h')       xTicks = [0, 15, 30, 45, c.len - 1];
  else if (range === '24h') xTicks = [0, 6, 12, 18, c.len - 1];
  else if (range === '7d')  xTicks = Array.from({ length: c.len }, (_, i) => i);
  else /* 30d */            xTicks = [0, 7, 14, 21, c.len - 1];

  return { series, point, xTicks, dipIdx: c.dip.idx };
}

function quantile(arr, q) {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = (sorted.length - 1) * q;
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function Spark({ data, color = 'var(--ink)', height = 36, fill = false }) {
  const w = 200, h = height, p = 3;
  const min = Math.min(...data), max = Math.max(...data);
  const r = max - min || 1;
  const pts = data.map((v, i) => [p + (i/(data.length-1))*(w-p*2), p + (1 - (v-min)/r)*(h-p*2)]);
  const path = pts.map((pt,i) => (i?'L':'M')+pt[0].toFixed(1)+','+pt[1].toFixed(1)).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
      {fill && <path d={path + ` L${pts.at(-1)[0]},${h} L${pts[0][0]},${h} Z`} fill={color} opacity="0.1"/>}
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function DashboardScreen({ onNavigate, onConnect, onOpenCompany }) {
  const { COMPANIES, LOCALES, EVENTS, DEVICES } = window.MOCK;
  const total = DEVICES.length;
  const online = DEVICES.filter(d => d.status === 'online').length;
  const offline = total - online;
  const uptime = ((online/total)*100).toFixed(1);

  // Quick connect — find device by ID and open remote session
  const [quickId, setQuickId] = useState('');
  const [quickErr, setQuickErr] = useState(null);
  const normId = (s) => (s || '').replace(/\s+/g, '');
  const tryQuickConnect = () => {
    const target = normId(quickId);
    if (!target) return;
    const dev = DEVICES.find(d => normId(d.rustdeskId) === target);
    if (!dev) {
      setQuickErr('Dispositivo no encontrado en la red.');
      return;
    }
    if (dev.status !== 'online') {
      setQuickErr(`${dev.name} está offline · último ping ${dev.lastSeen}.`);
      return;
    }
    setQuickErr(null);
    setQuickId('');
    onConnect && onConnect(dev);
  };

  // Connectivity chart — dynamic range + auto-refresh every 30s
  const [range, setRange] = useState('24h');
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);
  const conn = useMemo(() => buildConnSeries(range, tick), [range, tick]);
  const p50 = quantile(conn.series, 0.5);
  const p95 = quantile(conn.series, 0.95);
  const dip = conn.point(conn.dipIdx);

  // Events filter
  const [eventFilter, setEventFilter] = useState('all'); // 'all' | 'sessions' | 'alerts'
  const filteredEvents = useMemo(() => {
    if (eventFilter === 'all') return EVENTS;
    const sessionTypes = ['connect', 'transfer', 'login', 'update'];
    const alertTypes   = ['offline', 'reconnect'];
    const set = eventFilter === 'sessions' ? sessionTypes : alertTypes;
    return EVENTS.filter(e => set.includes(e.type));
  }, [eventFilter, EVENTS]);

  return (
    <div className="fade-in" style={{ padding: '0 28px 60px' }}>
      {/* Big number band */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid var(--line)' }}>
        {[
          { l: 'Total POS',     v: total,    s: '+2', tone: 'plum',  k: 'Inventario activo'  },
          { l: 'En línea',      v: online,   s: uptime + '%', tone: 'good', k: 'Heartbeat < 60s', live: true },
          { l: 'Sin conexión',  v: offline,  s: offline + ' alertas', tone: offline ? 'bad' : 'good', k: '> 1 h sin reportar' },
          { l: 'Sesiones live', v: 3,        s: '2 técnicos', tone: 'plum', k: 'Activas ahora' },
        ].map((s, i, a) => (
          <div key={s.l} style={{ padding: '28px 24px 24px', borderRight: i < a.length-1 ? '1px solid var(--line)' : 'none' }}>
            <div className="marker" style={{ marginBottom: 14 }}>
              <span>0{i+1} / {s.l}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span className="display num" style={{ fontSize: 64, lineHeight: 0.85 }}>{s.v}</span>
              {s.live && <span className="dot-wrap"><span className="dot ok live" style={{ color: 'var(--good)' }}/></span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
              <span className={`chip ${s.tone}`}>{s.s}</span>
              <span className="serial">{s.k}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Main grid */}
      <section style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 0, borderBottom: '1px solid var(--line)' }}>
        {/* Chart */}
        <div style={{ padding: '28px 24px', borderRight: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22 }}>
            <div>
              <div className="marker" style={{ marginBottom: 10 }}>05 / Conectividad de la red</div>
              <h3 className="display" style={{ fontSize: 26, margin: 0 }}>Últimas <span className="italic-d">24 horas</span></h3>
            </div>
            <div className="seg">
              {['1h','24h','7d','30d'].map(p => (
                <button key={p} data-active={p === range} onClick={() => setRange(p)}>{p}</button>
              ))}
            </div>
          </div>
          <BigChart series={conn.series} point={conn.point} xTicks={conn.xTicks} dipIdx={conn.dipIdx}/>
          <div style={{ display: 'flex', gap: 24, marginTop: 18, fontSize: 11, color: 'var(--ink-mute)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 2, background: 'var(--plum)' }}/>
              <span className="mono">% en línea</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--lime)' }}/>
              <span className="mono">incidencia {dip.label} — {dip.value.toFixed(1)} %</span>
            </div>
            <div style={{ marginLeft: 'auto' }} className="serial">p50 = {p50.toFixed(1)} %  ·  p95 = {p95.toFixed(1)} %</div>
          </div>
        </div>

        {/* Companies */}
        <div style={{ padding: '28px 24px' }}>
          <div className="marker" style={{ marginBottom: 14 }}>06 / Empresas registradas</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {COMPANIES.map((c, i) => {
              const lc = LOCALES.filter(l => l.company === c.name).length;
              return (
                <button
                  key={c.name}
                  onClick={() => onOpenCompany ? onOpenCompany(c.name) : onNavigate('network')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 4px',
                    borderTop: i === 0 ? '1px solid var(--line)' : 'none',
                    borderBottom: '1px solid var(--line)',
                    borderLeft: 'none', borderRight: 'none',
                    background: 'transparent',
                    textAlign: 'left', cursor: 'pointer', width: '100%',
                    transition: 'background 120ms ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--paper-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: c.color, flexShrink: 0 }}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 3, letterSpacing: '0.04em' }}>
                      ID {c.idSucursal} · {lc} {lc === 1 ? 'local' : 'locales'} · {c.pos} POS
                    </div>
                  </div>
                  <Icon name="arrowRt" size={12} style={{ color: 'var(--ink-soft)' }}/>
                </button>
              );
            })}
          </div>
          <button className="btn btn-sm btn-ghost" onClick={() => onNavigate('network')} style={{ marginTop: 18, padding: 0 }}>Gestionar empresas <Icon name="arrowRt" size={12}/></button>
        </div>
      </section>

      {/* Activity + side */}
      <section style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 0 }}>
        <div style={{ padding: '28px 24px', borderRight: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <div className="marker" style={{ marginBottom: 10 }}>07 / Actividad</div>
              <h3 className="display" style={{ fontSize: 26, margin: 0 }}>Eventos <span className="italic-d">recientes</span></h3>
            </div>
            <div className="seg">
              {[
                { id: 'all',      label: 'Todo' },
                { id: 'sessions', label: 'Sesiones' },
                { id: 'alerts',   label: 'Alertas' },
              ].map(f => (
                <button key={f.id} data-active={eventFilter === f.id} onClick={() => setEventFilter(f.id)}>{f.label}</button>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--line)' }}>
            {filteredEvents.length === 0 && (
              <div style={{ padding: '28px 0', textAlign: 'center', fontSize: 12, color: 'var(--ink-mute)' }}>
                <span className="mono">Sin eventos en este filtro.</span>
              </div>
            )}
            {filteredEvents.map((e, i) => {
              const meta = {
                connect:   { ic: 'arrowRt', tone: 'plum', label: 'Sesión iniciada' },
                offline:   { ic: 'bell0',   tone: e.level==='warn'?'warn':'bad', label: 'Dispositivo offline' },
                transfer:  { ic: 'file',    tone: 'plum', label: 'Transferencia de archivo' },
                reconnect: { ic: 'refresh', tone: 'good', label: 'Reconectado' },
                update:    { ic: 'download',tone: 'plum', label: 'Cliente actualizado' },
                login:     { ic: 'user',    tone: 'plum', label: 'Inicio de sesión' },
              }[e.type];
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 24px 1fr 90px', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--line)' }}>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--ink-soft)' }}>#{String(i+1).padStart(3,'0')}</span>
                  <div style={{ width: 24, height: 24, borderRadius: 4, background: meta.tone === 'plum' ? 'var(--plum-soft)' : `var(--${meta.tone}-soft)`, color: meta.tone === 'plum' ? 'var(--plum)' : `var(--${meta.tone})`, display: 'grid', placeItems: 'center' }}><Icon name={meta.ic} size={12}/></div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{meta.label}</div>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.who}{e.detail ? ' · '+e.detail : ''}{e.by ? ' · '+e.by : ''}
                    </div>
                  </div>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)', textAlign: 'right' }}>{e.t}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* Quick connect */}
          <div>
            <div className="marker" style={{ marginBottom: 12 }}>09 / Conexión rápida</div>
            <div className="card" style={{ padding: 16 }}>
              <div className="serial" style={{ marginBottom: 6 }}>ID DPS Desk</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  className="input mono"
                  placeholder="928 341 003"
                  style={{ height: 34, fontSize: 12 }}
                  value={quickId}
                  onChange={e => { setQuickId(e.target.value); if (quickErr) setQuickErr(null); }}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); tryQuickConnect(); } }}
                />
                <button
                  className="btn btn-primary btn-sm"
                  style={{ height: 34 }}
                  onClick={tryQuickConnect}
                  disabled={!normId(quickId)}
                  title="Conectar"
                ><Icon name="arrowRt" size={13}/></button>
              </div>
              {quickErr && (
                <div className="mono" style={{ marginTop: 8, fontSize: 11, color: 'var(--bad)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="x" size={11}/>
                  <span>{quickErr}</span>
                </div>
              )}
              <div className="serial" style={{ marginTop: 14, marginBottom: 6 }}>Recientes</div>
              {DEVICES.slice(0, 3).map(d => {
                const disabled = d.status !== 'online';
                return (
                  <button
                    key={d.id}
                    onClick={() => !disabled && onConnect && onConnect(d)}
                    disabled={disabled}
                    title={disabled ? `${d.name} · offline` : `Conectar a ${d.name}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0',
                      fontSize: 12, color: 'var(--ink-mute)',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.5 : 1,
                      width: '100%', textAlign: 'left',
                      background: 'transparent', border: 'none',
                    }}
                  >
                    <span className={`dot ${d.status === 'online' ? 'ok' : 'bad'}`}/>
                    <span className="mono">{d.rustdeskId}</span>
                    <span style={{ color: 'var(--ink-soft)', fontSize: 11 }}>· {d.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function BigChart({ series, point, xTicks, dipIdx }) {
  const w = 800, h = 200, pl = 32, pr = 14, pt = 14, pb = 22;
  const min = 60, max = 100;
  const xStep = (w - pl - pr) / (series.length - 1);
  const pts = series.map((v, i) => [pl + i*xStep, pt + (1 - (v-min)/(max-min)) * (h - pt - pb)]);
  const path = pts.map((p,i) => (i?'L':'M')+p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
  const area = path + ` L${pts.at(-1)[0]},${h-pb} L${pts[0][0]},${h-pb} Z`;

  const svgRef = useRef(null);
  const [hover, setHover] = useState(null); // index or null

  const onMove = (e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * w;
    const i = Math.round((x - pl) / xStep);
    if (i < 0 || i > series.length - 1) { setHover(null); return; }
    setHover(i);
  };
  const onLeave = () => setHover(null);

  const hp = hover != null ? point(hover) : null;
  const hpt = hover != null ? pts[hover] : null;
  // Tooltip: keep inside chart bounds
  const tipW = 124;
  const tipX = hpt ? Math.max(pl, Math.min(w - pr - tipW, hpt[0] - tipW / 2)) : 0;
  const tipY = hpt ? Math.max(pt, hpt[1] - 52) : 0;

  return (
    <svg ref={svgRef} viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 200, cursor: 'crosshair', display: 'block' }}
         onMouseMove={onMove} onMouseLeave={onLeave}>
      {[0, 0.5, 1].map(t => {
        const y = pt + t*(h-pt-pb);
        const v = max - t*(max-min);
        return (
          <g key={t}>
            <line x1={pl} y1={y} x2={w-pr} y2={y} stroke="var(--line)" strokeDasharray={t===1?'0':'2 4'}/>
            <text x={pl-8} y={y+3} textAnchor="end" fontSize="10" fill="var(--ink-soft)" fontFamily="var(--mono)">{Math.round(v)}</text>
          </g>
        );
      })}
      {xTicks.map(i => (
        <text key={i} x={pl + i*xStep} y={h-6} fontSize="10" fill="var(--ink-soft)" fontFamily="var(--mono)" textAnchor="middle">{point(i).label}</text>
      ))}
      <path d={area} fill="var(--plum)" opacity="0.12"/>
      <path d={path} fill="none" stroke="var(--plum)" strokeWidth="2"/>
      {/* Dip marker */}
      <circle cx={pts[dipIdx][0]} cy={pts[dipIdx][1]} r="4" fill="var(--paper)" stroke="var(--plum)" strokeWidth="2"/>
      <circle cx={pts[dipIdx][0]} cy={pts[dipIdx][1]} r="9" fill="none" stroke="var(--lime)" strokeWidth="1.5"/>

      {/* Hover guide + dot + tooltip */}
      {hpt && (
        <g pointerEvents="none">
          <line x1={hpt[0]} y1={pt} x2={hpt[0]} y2={h-pb} stroke="var(--plum)" strokeWidth="1" strokeDasharray="2 3" opacity="0.5"/>
          <circle cx={hpt[0]} cy={hpt[1]} r="4.5" fill="var(--paper)" stroke="var(--plum)" strokeWidth="2"/>
          <g transform={`translate(${tipX}, ${tipY})`}>
            <rect width={tipW} height="42" rx="6" fill="var(--plum)" opacity="0.97"/>
            <text x="10" y="17" fontSize="10" fontFamily="var(--mono)" fill="rgba(255,255,255,0.7)" style={{ letterSpacing: '0.04em' }}>{hp.label}</text>
            <text x="10" y="34" fontSize="14" fontFamily="var(--display)" fontWeight="600" fill="#FFFFFF">{hp.value.toFixed(1)} <tspan fontSize="10" fontFamily="var(--mono)" fill="rgba(255,255,255,0.7)">% en línea</tspan></text>
          </g>
        </g>
      )}
    </svg>
  );
}

window.DashboardScreen = DashboardScreen;
