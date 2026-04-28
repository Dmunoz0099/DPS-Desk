/* global React */
const { useState, useEffect, useRef } = React;

function RemoteSession({ device, onClose, initialTool, initialAdmin }) {
  const [tool, setTool] = useState(initialTool || 'screen');
  const [admin, setAdmin] = useState(!!initialAdmin);
  const [elapsed, setElapsed] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const [logs, setLogs] = useState([]);
  const [cmd, setCmd] = useState('');
  const [winState, setWinState] = useState('normal'); // 'normal' | 'min' | 'max'
  const tEnd = useRef(false);

  // Tick timer
  useEffect(() => {
    if (tEnd.current) return;
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Log when tool changes (skip first render)
  const firstTool = useRef(true);
  useEffect(() => {
    if (firstTool.current) { firstTool.current = false; return; }
    const labels = { screen: 'PANTALLA', transfer: 'TRANSFERIR', terminal: 'TERMINAL', audit: 'AUDITAR' };
    setLogs(l => [...l, { level: 'info', msg: `Cambiando a modo ${labels[tool]}…` }]);
  }, [tool]);

  // Stream logs progressively
  useEffect(() => {
    const seq = [
      { t: 100,  level: 'info',  msg: `Buscando ID ${device.rustdeskId.replace(/\s/g, '')}…` },
      { t: 900,  level: 'good',  msg: 'Túnel RustDesk establecido.' },
      { t: 1700, level: 'plum',  msg: `Sincronizando pantalla del POS · ${device.company}` },
      { t: 2400, level: 'info',  msg: 'Negociando códec H.264 · 1080p · 30 fps' },
      { t: 3100, level: 'good',  msg: 'Sesión interactiva activa.' },
      ...(admin ? [{ t: 3500, level: 'warn', msg: '⚠ Privilegios de administrador concedidos · UAC aprobado' }] : []),
      { t: 4500, level: 'info',  msg: 'Latencia estimada: 38 ms · pérdida 0.0 %' },
    ];
    const ids = seq.map(s => setTimeout(() => setLogs(l => [...l, s]), s.t));
    // Hide intro overlay after a moment
    const hi = setTimeout(() => setShowOverlay(false), 3400);
    return () => { ids.forEach(clearTimeout); clearTimeout(hi); };
  }, [device.rustdeskId]);

  const fmtTime = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return [h, m, sec].map(n => String(n).padStart(2, '0')).join(':');
  };

  const sendCmd = (e) => {
    e?.preventDefault();
    if (!cmd.trim()) return;
    setLogs(l => [...l, { level: 'cmd', msg: '> ' + cmd }, { level: 'info', msg: 'OK · 12 ms' }]);
    setCmd('');
  };

  const finalize = () => {
    tEnd.current = true;
    setLogs(l => [...l, { level: 'warn', msg: 'Cerrando túnel…' }, { level: 'info', msg: 'Sesión finalizada.' }]);
    setTimeout(onClose, 600);
  };

  return (
    <div className="fade-in" style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'var(--paper)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <header style={{
        padding: '18px 28px',
        borderBottom: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', gap: 24,
        background: 'var(--paper-up)',
      }}>
        <button onClick={onClose} className="btn btn-sm" style={{ padding: 6 }}>
          <Icon name="chevronL" size={14}/>
        </button>
        <div style={{ flex: 1 }}>
          <div className="marker" style={{ marginBottom: 6 }}>SESIÓN REMOTA · {device.rustdeskId}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <h2 className="display" style={{ margin: 0, fontSize: 22 }}>
              <span className="italic-d">{device.name}</span>
            </h2>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{device.company} · local {device.localCod}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="dot-wrap"><span className="dot ok live" style={{ color: 'var(--good)' }}/></span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)' }}>conectado · 38 ms</span>
        </div>
      </header>

      {/* Body grid */}
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 320px', gap: 0 }}>
        {/* Stage */}
        <div style={{
          padding: winState === 'max' ? 0 : 28,
          display: 'flex',
          alignItems: winState === 'min' ? 'flex-end' : 'center',
          justifyContent: 'center',
          overflow: 'auto',
          background: winState === 'max' ? 'var(--ink)' : 'transparent',
          transition: 'padding 0.25s ease, background 0.25s ease',
        }}>
          <RemoteWindow
            device={device}
            tool={tool}
            admin={admin}
            setAdmin={setAdmin}
            elapsed={fmtTime(elapsed)}
            showOverlay={showOverlay}
            onFinalize={finalize}
            winState={winState}
            setWinState={setWinState}
          />
        </div>

        {/* Right rail */}
        <aside style={{ borderLeft: '1px solid var(--line)', background: 'var(--paper-up)', display: 'flex', flexDirection: 'column' }}>
          {/* Controls */}
          <div style={{ padding: 22 }}>
            <div className="marker" style={{ marginBottom: 14 }}>Controles de sesión</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <ToolBtn id="transfer" active={tool} onClick={setTool} icon="upload" label="Transferir"/>
              <ToolBtn id="screen"   active={tool} onClick={setTool} icon="monitor" label="Pantalla"/>
              <ToolBtn id="terminal" active={tool} onClick={setTool} icon="terminal" label={admin ? 'Term · Admin' : 'Terminal'}/>
              <ToolBtn id="audit"    active={tool} onClick={setTool} icon="history" label="Auditar"/>
            </div>
          </div>

          <hr className="hr"/>

          {/* Log */}
          <div style={{ padding: 22, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div className="marker" style={{ marginBottom: 14 }}>Log de conectividad</div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
              {logs.length === 0 && <div className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)' }}>esperando handshake…</div>}
              {logs.map((l, i) => <LogEntry key={i} entry={l}/>)}
            </div>
          </div>

          <hr className="hr"/>

          {/* Quick command */}
          <form onSubmit={sendCmd} style={{ padding: 18, display: 'flex', gap: 6 }}>
            <input
              className="input mono"
              placeholder="comando rápido…"
              value={cmd}
              onChange={e => setCmd(e.target.value)}
              style={{ height: 34, fontSize: 12 }}
            />
            <button type="submit" className="btn btn-acid btn-sm" style={{ height: 34 }}>Ejecutar</button>
          </form>
        </aside>
      </div>
    </div>
  );
}

function ToolBtn({ id, active, onClick, icon, label }) {
  const isActive = id === active;
  return (
    <button
      onClick={() => onClick(id)}
      style={{
        padding: '14px 12px',
        background: isActive ? 'var(--plum)' : 'var(--paper-up)',
        color: isActive ? '#FFFFFF' : 'var(--ink)',
        border: '1px solid ' + (isActive ? 'var(--plum-2)' : 'var(--line)'),
        borderRadius: 'var(--r-sm)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        cursor: 'pointer',
        transition: 'all 120ms ease',
      }}
    >
      <Icon name={icon} size={18}/>
      <span className="mono" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
    </button>
  );
}

function LogEntry({ entry }) {
  const palette = {
    info: { bg: 'var(--paper-2)',  fg: 'var(--ink-mute)',   bdr: 'var(--line)' },
    good: { bg: 'var(--good-soft)', fg: 'var(--good)',       bdr: 'transparent' },
    warn: { bg: 'var(--warn-soft)', fg: 'var(--warn)',       bdr: 'transparent' },
    plum: { bg: 'var(--plum-soft)', fg: 'var(--plum)',       bdr: 'transparent' },
    cmd:  { bg: 'var(--ink)',       fg: 'var(--lime)',       bdr: 'var(--ink)' },
  }[entry.level] || {};
  return (
    <div className="fade-in" style={{
      padding: '8px 10px',
      borderRadius: 'var(--r-sm)',
      background: palette.bg, color: palette.fg, border: '1px solid ' + palette.bdr,
      fontFamily: 'var(--mono)', fontSize: 11, lineHeight: 1.4,
    }}>{entry.msg}</div>
  );
}

function RemoteWindow({ device, tool, admin, setAdmin, elapsed, showOverlay, onFinalize, winState, setWinState }) {
  const toolLabel = { screen: 'MONITOR', transfer: 'TRANSFER', terminal: 'TERMINAL', audit: 'AUDITAR' }[tool];
  const isMin = winState === 'min';
  const isMax = winState === 'max';

  const winStyle = isMax
    ? { width: '100%', height: '100%', aspectRatio: 'auto', borderRadius: 0, boxShadow: 'none' }
    : isMin
      ? { width: 360, height: 56, aspectRatio: 'auto', borderRadius: 'var(--r-md)', boxShadow: '0 16px 40px -12px rgba(14,14,16,0.45)' }
      : { width: 'min(100%, 980px)', aspectRatio: '16/10', borderRadius: 'var(--r-lg)', boxShadow: '0 24px 60px -16px rgba(14,14,16,0.4), 0 0 0 1px rgba(14,14,16,0.1)' };

  return (
    <div style={{
      ...winStyle,
      background: 'var(--ink)',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      position: 'relative',
      transition: 'width 0.25s ease, height 0.25s ease, border-radius 0.25s ease',
    }}>
      {/* Title bar */}
      <div style={{
        height: 44, padding: '0 16px',
        background: 'var(--ink)',
        borderBottom: isMin ? 'none' : '1px solid #1f1f25',
        display: 'flex', alignItems: 'center', gap: 14,
        flexShrink: 0,
      }}>
        <div className="traffic" style={{ display: 'flex', gap: 8 }}>
          <TrafficLight color="#FF5F57" hover="#E0443E" title="Cerrar"
            onClick={onFinalize}
            glyph={<svg width="6" height="6" viewBox="0 0 8 8"><path d="M1 1 L7 7 M7 1 L1 7" stroke="#4D0000" strokeWidth="1.2" strokeLinecap="round"/></svg>}
          />
          <TrafficLight color="#FEBC2E" hover="#DEA21B" title="Minimizar"
            onClick={() => setWinState(isMin ? 'normal' : 'min')}
            glyph={<svg width="6" height="2" viewBox="0 0 8 2"><path d="M1 1 H7" stroke="#5C3D00" strokeWidth="1.2" strokeLinecap="round"/></svg>}
          />
          <TrafficLight color="#28C840" hover="#1DA72A" title={isMax ? 'Restaurar' : 'Maximizar'}
            onClick={() => setWinState(isMax ? 'normal' : 'max')}
            glyph={isMax
              ? <svg width="7" height="7" viewBox="0 0 8 8"><path d="M3 1 L7 1 L7 5 M5 7 L1 7 L1 3" stroke="#003B00" strokeWidth="1.1" fill="none" strokeLinecap="round"/></svg>
              : <svg width="7" height="7" viewBox="0 0 8 8"><path d="M2 2 L6 2 L6 6 L2 6 Z" stroke="#003B00" strokeWidth="1.1" fill="none"/></svg>}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="mono" style={{ color: 'var(--paper)', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>POS-TERMINAL · {device.name}</div>
          {!isMin && (
            <div className="serial" style={{ color: 'var(--lime)', fontSize: 9, marginTop: 1 }}>● SESIÓN ACTIVA — {toolLabel}</div>
          )}
        </div>
        {!isMin && (
          <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--ink-soft)', fontSize: 11 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="zap" size={11}/>
              <span style={{ color: 'var(--paper)' }}>{elapsed}</span>
            </span>
            <span>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Icon name="monitor" size={11}/>
              <span style={{ color: 'var(--paper)' }}>HD</span>
            </span>
          </div>
        )}
        {isMin && (
          <span className="mono" style={{ color: 'var(--lime)', fontSize: 10 }}>{elapsed}</span>
        )}
      </div>

      {/* Stream area — hidden when minimized */}
      {!isMin && (
      <div style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        background: tool === 'terminal' ? '#0A1410' : '#0F1419',
      }}>
        {tool === 'screen'   && <FakeRemoteDesktop/>}
        {tool === 'transfer' && <TransferView device={device}/>}
        {tool === 'terminal' && <TerminalView device={device} admin={admin} onToggleAdmin={() => setAdmin(a => !a)}/>}
        {tool === 'audit'    && <AuditView device={device}/>}

        {/* Scanline overlay (only on screen mode) */}
        {tool === 'screen' && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0) 0px, rgba(255,255,255,0) 3px, rgba(255,255,255,0.025) 3px, rgba(255,255,255,0.025) 4px)',
            pointerEvents: 'none',
          }}/>
        )}

        {/* Center overlay (handshake intro / ritual) */}
        {showOverlay && tool === 'screen' && (
          <div className="fade-in" style={{
            position: 'absolute', inset: 0,
            display: 'grid', placeItems: 'center',
            background: 'rgba(15,20,25,0.45)',
            backdropFilter: 'blur(2px)',
          }}>
            <div style={{
              padding: '36px 44px',
              background: 'rgba(20,20,24,0.78)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 'var(--r-lg)',
              backdropFilter: 'blur(14px)',
              textAlign: 'center',
              minWidth: 320,
              color: 'var(--paper)',
            }}>
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
                <Icon name="monitor" size={42} stroke={1.4} style={{ color: 'var(--paper)', opacity: 0.85 }}/>
                <span style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 999, background: 'var(--lime)', boxShadow: '0 0 0 3px rgba(197,242,62,0.25)' }}/>
              </div>
              <div className="display" style={{ fontSize: 26, lineHeight: 1.05, color: 'var(--paper)' }}>
                Sesión <span className="italic-d">iniciada</span>
              </div>
              <div className="mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {device.company} · {device.name}
              </div>
            </div>
          </div>
        )}

        {/* Floating finalize button */}
        <button onClick={onFinalize} style={{
          position: 'absolute', bottom: 18, right: 18,
          padding: '10px 16px',
          background: 'var(--bad)',
          color: '#fff',
          border: 'none', borderRadius: 'var(--r-sm)',
          fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          display: 'inline-flex', alignItems: 'center', gap: 8,
          cursor: 'pointer',
          zIndex: 5,
          boxShadow: '0 6px 18px -4px rgba(209,67,67,0.5)',
        }}>
          <Icon name="logout" size={12}/>
          Finalizar conexión
        </button>
      </div>
      )}
    </div>
  );
}

function TrafficLight({ color, hover, glyph, onClick, title }) {
  const [isHover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={title}
      style={{
        width: 12, height: 12, borderRadius: 999,
        background: isHover ? hover : color,
        border: 'none',
        padding: 0,
        display: 'grid', placeItems: 'center',
        cursor: 'pointer',
        transition: 'background 0.12s ease',
      }}
    >
      <span style={{ opacity: isHover ? 1 : 0, transition: 'opacity 0.12s ease', display: 'grid', placeItems: 'center' }}>{glyph}</span>
    </button>
  );
}

function FakeRemoteDesktop() {
  // Sketch a POS-like UI to live in the "stream" — implies real remote screen
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(180deg, #0F1419 0%, #1A2128 100%)',
      padding: 18,
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      {/* Faux POS header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.7)', fontSize: 10, fontFamily: 'var(--mono)' }}>
        <span style={{ width: 18, height: 18, borderRadius: 3, background: 'rgba(255,255,255,0.1)' }}/>
        <span>FARMASYS · TERMINAL DE VENTA</span>
        <span style={{ marginLeft: 'auto' }}>CAJERO: MARÍA L.</span>
      </div>
      {/* Faux content */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 10 }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            ['Paracetamol 500mg x20', '$1.890'],
            ['Ibuprofeno 400mg x10',  '$2.490'],
            ['Vitamina C 1g x30',      '$5.690'],
            ['Termómetro digital',     '$8.990'],
          ].map(([n, p], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: 11, color: 'rgba(255,255,255,0.78)' }}>
              <span>{n}</span><span>{p}</span>
            </div>
          ))}
          <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: 14, color: '#fff', fontWeight: 700 }}>
            <span>TOTAL</span><span>$ 19.060</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, alignContent: 'start' }}>
          {['EFECTIVO','TARJETA','TRANSFER.','CRÉDITO','DESCUENTO','CANCELAR'].map((k, i) => (
            <div key={i} style={{
              padding: '14px 8px', textAlign: 'center',
              background: i === 1 ? 'rgba(197,242,62,0.18)' : 'rgba(255,255,255,0.05)',
              border: '1px solid ' + (i === 1 ? 'rgba(197,242,62,0.4)' : 'rgba(255,255,255,0.08)'),
              borderRadius: 4,
              fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
              color: i === 1 ? '#C5F23E' : 'rgba(255,255,255,0.7)',
              letterSpacing: '0.04em',
            }}>{k}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TransferView({ device }) {
  const [selected, setSelected] = useState({ side: 'local', name: null });
  const localFiles = [
    { n: 'documentos.zip',          k: '12.4 MB',  i: 'file' },
    { n: 'actualización_pos.exe',   k: '48.1 MB',  i: 'download' },
    { n: 'configuración.json',      k: '4.2 KB',   i: 'file' },
    { n: 'log_error.txt',           k: '128 KB',   i: 'file' },
    { n: 'parche-2026.04.dmg',      k: '210 MB',   i: 'file' },
  ];
  const remoteFiles = [
    { n: 'VentasHoy.db',            k: '8.7 MB',   i: 'file', folder: false },
    { n: 'cache_data/',             k: '—',        i: 'folder', folder: true },
    { n: 'POS_CORE.app',            k: '184 MB',   i: 'file' },
    { n: 'Copia_de_seguridad/',     k: '—',        i: 'folder', folder: true },
    { n: 'recibos_abril/',          k: '—',        i: 'folder', folder: true },
    { n: 'startup.cmd',             k: '2 KB',     i: 'file' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 32px 1fr', height: '100%', position: 'relative' }}>
      <FilePane title="Mi Equipo" subtitle="(Local)" icon="laptop" files={localFiles} side="local" selected={selected} setSelected={setSelected}/>
      {/* Divider */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}>
        <div style={{
          width: 26, height: 26, borderRadius: 999,
          background: 'rgba(197,242,62,0.12)',
          color: 'var(--lime)',
          display: 'grid', placeItems: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7h13l-3-3M21 17H8l3 3"/>
          </svg>
        </div>
      </div>
      <FilePane title={device.name} subtitle="(Remoto)" icon="monitor" files={remoteFiles} side="remote" selected={selected} setSelected={setSelected}/>
    </div>
  );
}

function FilePane({ title, subtitle, icon, files, side, selected, setSelected }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Pane header */}
      <div style={{
        padding: '12px 14px',
        display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <Icon name={icon} size={13} style={{ color: 'rgba(255,255,255,0.6)' }}/>
        <span className="mono" style={{ color: 'var(--paper)', fontSize: 11, fontWeight: 600, letterSpacing: '0.03em' }}>{title}</span>
        <span className="mono" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>{subtitle}</span>
        <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.5)', display: 'inline-flex', gap: 6 }}>
          <button style={{ width: 22, height: 22, borderRadius: 3, color: 'inherit', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><Icon name="upload" size={12}/></button>
          <button style={{ width: 22, height: 22, borderRadius: 3, color: 'inherit', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><Icon name="refresh" size={12}/></button>
        </span>
      </div>
      {/* Path bar */}
      <div style={{ padding: '6px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
        {side === 'local' ? '~/Desktop/dps-desk/' : 'C:\\POS\\actual\\'}
      </div>
      {/* Files */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 6 }}>
        {files.map((f, i) => {
          const active = selected.side === side && selected.name === f.n;
          return (
            <button key={i}
              onClick={() => setSelected({ side, name: f.n })}
              style={{
                width: '100%', textAlign: 'left',
                padding: '6px 10px',
                display: 'flex', alignItems: 'center', gap: 10,
                background: active ? 'rgba(197,242,62,0.1)' : 'transparent',
                border: 'none',
                borderRadius: 4,
                color: active ? 'var(--lime)' : 'rgba(255,255,255,0.78)',
                cursor: 'pointer',
                fontSize: 12,
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon name={f.folder ? 'layers' : 'file'} size={13} style={{ color: f.folder ? 'var(--lime)' : 'inherit', opacity: f.folder ? 1 : 0.7 }}/>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.n}</span>
              <span className="mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{f.k}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TerminalView({ device, admin, onToggleAdmin }) {
  const greet = (isAdmin) => isAdmin
    ? [
        { kind: 'sys',  text: 'Interfaz de terminal v1.8.4 · MODO ADMINISTRADOR' },
        { kind: 'warn', text: '⚠ Sesión con privilegios elevados — UAC aprobado.' },
        { kind: 'sys',  text: `Conectado a POS-TERMINAL-${device.name.replace(/[^0-9]/g, '') || '1'} como NT AUTHORITY\\SYSTEM` },
        { kind: 'sys',  text: 'Escribe `help` para ver los comandos disponibles.' },
        { kind: 'sys',  text: 'Esperando comandos…' },
      ]
    : [
        { kind: 'sys', text: 'Interfaz de terminal v1.8.4' },
        { kind: 'sys', text: `Conectado a POS-TERMINAL-${device.name.replace(/[^0-9]/g, '') || '1'}` },
        { kind: 'sys', text: 'Escribe `help` para ver los comandos disponibles.' },
        { kind: 'sys', text: 'Esperando comandos…' },
      ];

  const [history, setHistory] = useState(() => greet(admin));
  const [input, setInput] = useState('');
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const lastAdmin = useRef(admin);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history]);

  // Append a banner line when admin state toggles mid-session
  useEffect(() => {
    if (lastAdmin.current === admin) return;
    lastAdmin.current = admin;
    setHistory(h => [...h, {
      kind: admin ? 'warn' : 'sys',
      text: admin
        ? '⚠ Privilegios elevados · ahora ejecutas como NT AUTHORITY\\SYSTEM'
        : '↓ Privilegios reducidos · sesión estándar.'
    }]);
  }, [admin]);

  const baseHandlers = {
    help:     (isAdmin) => 'Comandos: help, ls, ps, ipconfig, ping <host>, status, whoami, clear'
                          + (isAdmin ? ', services, regedit, shutdown, restart, taskkill <pid>' : ''),
    ls:       () => 'C:\\POS> POS_CORE.app  VentasHoy.db  cache_data\\  recibos_abril\\  startup.cmd',
    ps:       () => 'PID    NAME              CPU   MEM\n1024  pos_core.exe       4%   148M\n1450  rustdesk.exe       1%    62M\n2104  cashier_ui.exe     2%    98M',
    ipconfig: () => 'Adaptador Ethernet: 192.168.1.18 / 255.255.255.0 / gw 192.168.1.1',
    status:   () => 'POS_CORE: OK · DB: OK · IMPRESORA: OK · LECTOR_BARRA: OK',
    whoami:   (isAdmin) => isAdmin ? 'nt authority\\system' : 'pos\\cajero',
    clear:    () => '__clear__',
  };

  const adminOnly = {
    services: () => 'STATE          NAME                     DISPLAY\nRunning        pos_core                 POS Core Service\nRunning        rustdesk                 RustDesk Agent\nStopped        windows-update           Windows Update',
    regedit:  () => 'Editor del registro abierto en HKLM\\SOFTWARE\\Digital Pharma\\POS',
    shutdown: () => '⚠ Apagando POS-TERMINAL en 60 segundos. (cancelar con `shutdown -a`)',
    restart:  () => '⚠ Reiniciando POS-TERMINAL…',
    taskkill: (isAdmin, args) => `Proceso ${args[0] || '?'} terminado.`,
  };

  const submit = (e) => {
    e?.preventDefault();
    const raw = input.trim();
    if (!raw) return;
    const [c, ...rest] = raw.split(/\s+/);
    let resp;
    if (c === 'ping') {
      resp = `Respuesta de ${rest[0] || 'host'}: tiempo=12ms TTL=64\nRespuesta de ${rest[0] || 'host'}: tiempo=11ms TTL=64`;
    } else if (baseHandlers[c]) {
      resp = baseHandlers[c](admin, rest);
    } else if (adminOnly[c]) {
      resp = admin
        ? adminOnly[c](admin, rest)
        : `Acceso denegado: '${c}' requiere privilegios de administrador. Reabre la terminal con "Terminal (Administrador)".`;
    } else {
      resp = `'${c}' no se reconoce como un comando interno o externo.`;
    }

    setHistory(h => {
      if (resp === '__clear__') return [];
      const isDenied = resp.startsWith('Acceso denegado');
      return [
        ...h,
        { kind: 'cmd', text: (admin ? '# ' : '$ ') + raw },
        { kind: isDenied ? 'warn' : 'out', text: resp },
      ];
    });
    setInput('');
  };

  // Color palette: regular = green, admin = warm amber
  const fg     = admin ? '#FFC766' : '#A8E89E';
  const fgDim  = admin ? '#D9A04C' : '#86CB7C';
  const fgBri  = admin ? '#FFE6BA' : '#E2FFE2';
  const fgWarn = admin ? '#FF8C5A' : '#F2C04E';
  const promptCh = admin ? '#' : '$';

  return (
    <div onClick={() => inputRef.current?.focus()} style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--mono)',
      cursor: 'text',
    }}>
      {/* Privilege banner */}
      <div style={{
        padding: '8px 22px',
        borderBottom: `1px solid ${admin ? 'rgba(255,140,90,0.25)' : 'rgba(168,232,158,0.12)'}`,
        background: admin ? 'rgba(255,140,90,0.08)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>
        <span style={{ color: admin ? '#FF8C5A' : '#86CB7C', fontWeight: 600 }}>
          {admin ? '● ADMINISTRADOR · NT AUTHORITY\\SYSTEM' : '● Usuario estándar · pos\\cajero'}
        </span>
        <button
          type="button"
          onClick={onToggleAdmin}
          style={{
            background: 'transparent',
            border: `1px solid ${admin ? 'rgba(255,140,90,0.5)' : 'rgba(168,232,158,0.3)'}`,
            color: admin ? '#FFC766' : '#A8E89E',
            padding: '3px 10px',
            borderRadius: 4,
            fontFamily: 'inherit',
            fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          {admin ? 'Bajar privilegios' : 'Elevar a administrador'}
        </button>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '18px 22px 8px', fontSize: 12, lineHeight: 1.6, color: fg }}>
        {history.map((h, i) => (
          <pre key={i} style={{
            margin: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap',
            color: h.kind === 'cmd'  ? fgBri
                 : h.kind === 'sys'  ? fg
                 : h.kind === 'warn' ? fgWarn
                                     : fgDim,
          }}>
            {h.text}
          </pre>
        ))}
      </div>
      <form onSubmit={submit} style={{ padding: '10px 22px 14px', borderTop: `1px solid ${admin ? 'rgba(255,140,90,0.2)' : 'rgba(168,232,158,0.1)'}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: fg, fontSize: 13 }}>{promptCh}</span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={admin ? 'Comando con privilegios elevados…' : 'Escribe un comando…'}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: fg, fontFamily: 'inherit', fontSize: 13,
            caretColor: fg,
          }}
        />
      </form>
    </div>
  );
}

function AuditView({ device }) {
  const lines = [
    { t: '14:28:03', e: 'session.connect',       d: 'sesión iniciada', tone: '#A8E89E' },
    { t: '14:28:08', e: 'screen.handshake',     d: 'códec H.264 negociado', tone: '#A8E89E' },
    { t: '14:30:14', e: 'input.keystroke',     d: 'entrada de usuario · 24 eventos', tone: '#86CB7C' },
    { t: '14:35:42', e: 'tool.switch',         d: 'pantalla → transferir',  tone: '#FFE48A' },
    { t: '14:36:01', e: 'transfer.file.send',  d: 'configuración.json (4.2 KB)', tone: '#A8E89E' },
    { t: '14:38:10', e: 'tool.switch',         d: 'transferir → terminal', tone: '#FFE48A' },
    { t: '14:38:55', e: 'shell.exec',          d: '$ status', tone: '#86CB7C' },
  ];
  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '18px 22px', fontFamily: 'var(--mono)', fontSize: 11, lineHeight: 1.7, color: 'rgba(255,255,255,0.7)' }}>
      <div style={{ color: 'var(--lime)', marginBottom: 12, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>● AUDITORÍA EN VIVO · {device.name}</div>
      {lines.map((l, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '70px 180px 1fr', gap: 14, padding: '4px 0' }}>
          <span style={{ color: 'rgba(255,255,255,0.35)' }}>{l.t}</span>
          <span style={{ color: l.tone }}>{l.e}</span>
          <span>{l.d}</span>
        </div>
      ))}
    </div>
  );
}

window.RemoteSession = RemoteSession;