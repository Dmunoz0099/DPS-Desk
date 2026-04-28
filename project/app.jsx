/* global React, ReactDOM */
const { useState, useEffect, useRef } = React;

// =============================================================
// DPS DESK — Main App: Login + Shell + Routing + Tweaks + Modal
// =============================================================

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "indigo",
  "dark": false,
  "density": "comfortable",
  "radius": "default",
  "showTweakable": true
}/*EDITMODE-END*/;

const ACCENTS = {
  indigo: { 50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81' },
  violet: { 50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd', 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6', 900: '#4c1d95' },
  blue:   { 50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a' },
  teal:   { 50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e', 800: '#115e59', 900: '#134e4a' },
  rose:   { 50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af', 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c', 800: '#9f1239', 900: '#881337' },
  emerald:{ 50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b' },
};

function applyAccent(name) {
  const a = ACCENTS[name] || ACCENTS.indigo;
  const r = document.documentElement;
  Object.entries(a).forEach(([k, v]) => r.style.setProperty(`--accent-${k}`, v));
}

function applyDensity(d) {
  const r = document.documentElement;
  r.classList.remove('density-compact', 'density-spacious');
  if (d === 'compact') r.classList.add('density-compact');
  if (d === 'spacious') r.classList.add('density-spacious');
}

function applyRadius(rd) {
  const r = document.documentElement;
  r.classList.remove('radius-sharp', 'radius-soft');
  if (rd === 'sharp') r.classList.add('radius-sharp');
  if (rd === 'soft')  r.classList.add('radius-soft');
}

function applyDark(on) {
  document.documentElement.classList.toggle('dark', !!on);
}

function App() {
  const [tweaks, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  const [logged, setLogged] = useState(false);
  const [route, setRoute] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [connectingDevice, setConnectingDevice] = useState(null);

  // Apply tweaks to DOM
  useEffect(() => { applyAccent(tweaks.accent); }, [tweaks.accent]);
  useEffect(() => { applyDensity(tweaks.density); }, [tweaks.density]);
  useEffect(() => { applyRadius(tweaks.radius); }, [tweaks.radius]);
  useEffect(() => { applyDark(tweaks.dark); }, [tweaks.dark]);

  if (!logged) {
    return (
      <>
        <LoginScreen onLogin={() => setLogged(true)} dark={tweaks.dark} onToggleDark={() => setTweak('dark', !tweaks.dark)}/>
        <TweakPanel tweaks={tweaks} setTweak={setTweak}/>
      </>
    );
  }

  const titles = {
    dashboard: { t: 'Panel',         s: 'Vista general de la red' },
    network:   { t: 'Empresas',      s: 'Empresas, locales y dispositivos POS' },
    config:    { t: 'Configuración', s: 'Infraestructura, seguridad y equipo' },
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', height: '100vh' }}>
      <Sidebar
        active={route}
        onNavigate={setRoute}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <TopNav
          title={titles[route].t}
          subtitle={titles[route].s}
          dark={tweaks.dark}
          onToggleDark={() => setTweak('dark', !tweaks.dark)}
          onLogout={() => setLogged(false)}
        />
        <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }}>
          {route === 'dashboard' && <DashboardScreen onNavigate={setRoute}/>}
          {route === 'network'   && <NetworkScreen onConnect={setConnectingDevice}/>}
          {route === 'config'    && <ConfigScreen/>}
        </main>
      </div>
      <TweakPanel tweaks={tweaks} setTweak={setTweak}/>
      {connectingDevice && (
        <ConnectingModal device={connectingDevice} onClose={() => setConnectingDevice(null)}/>
      )}
    </div>
  );
}

// =============================================================
// Tweaks Panel
// =============================================================
function TweakPanel({ tweaks, setTweak }) {
  const { TweaksPanel, TweakSection, TweakRadio, TweakToggle, TweakSelect } = window;
  return (
    <TweaksPanel title="Tweaks" subtitle="Ajusta el sistema de diseño en vivo">
      <TweakSection title="Tema">
        <TweakToggle label="Modo oscuro" value={tweaks.dark} onChange={v => setTweak('dark', v)}/>
        <TweakSelect
          label="Acento"
          value={tweaks.accent}
          onChange={v => setTweak('accent', v)}
          options={[
            { value: 'indigo',  label: 'Índigo (marca)' },
            { value: 'violet',  label: 'Violeta' },
            { value: 'blue',    label: 'Azul' },
            { value: 'teal',    label: 'Teal' },
            { value: 'emerald', label: 'Esmeralda' },
            { value: 'rose',    label: 'Rosa' },
          ]}
        />
      </TweakSection>
      <TweakSection title="Layout">
        <TweakRadio
          label="Densidad"
          value={tweaks.density}
          onChange={v => setTweak('density', v)}
          options={[
            { value: 'compact',     label: 'Compact' },
            { value: 'comfortable', label: 'Cómodo' },
            { value: 'spacious',    label: 'Espacioso' },
          ]}
        />
        <TweakRadio
          label="Radio de bordes"
          value={tweaks.radius}
          onChange={v => setTweak('radius', v)}
          options={[
            { value: 'sharp',   label: 'Sharp' },
            { value: 'default', label: 'Default' },
            { value: 'soft',    label: 'Soft' },
          ]}
        />
      </TweakSection>
    </TweaksPanel>
  );
}

// =============================================================
// "Connecting" modal — quick remote session preview
// =============================================================
function ConnectingModal({ device, onClose }) {
  const [stage, setStage] = useState(0); // 0 connecting, 1 connected
  useEffect(() => { const id = setTimeout(() => setStage(1), 1100); return () => clearTimeout(id); }, []);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', zIndex: 60 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="card fade-in" style={{ width: 720, padding: 0, overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <span className={`status-dot ${stage === 1 ? 'ok' : 'warn'}`}/>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{stage === 1 ? 'Sesión activa' : 'Estableciendo conexión…'}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--fg-muted)', marginLeft: 'auto' }}>{device.rustdeskId}</div>
          <button className="btn-ghost" style={{ padding: 4, color: 'var(--fg-muted)' }} onClick={onClose}><Icon name="x" size={14}/></button>
        </div>
        <div style={{ padding: 24, background: '#0a0b0e', minHeight: 280, display: 'flex', flexDirection: 'column', gap: 14, color: '#cbd5e1' }}>
          <div className="mono" style={{ fontSize: 11, lineHeight: 1.7 }}>
            <div style={{ color: '#a5b4fc' }}>$ dps-desk connect {device.rustdeskId}</div>
            <div style={{ color: '#94a3b8' }}>→ resolviendo relay.dpsdesk.cl …  <span style={{ color: '#34d399' }}>OK (28 ms)</span></div>
            <div style={{ color: '#94a3b8' }}>→ negociando handshake AES-256 …  <span style={{ color: '#34d399' }}>OK</span></div>
            <div style={{ color: '#94a3b8' }}>→ peer  {device.ip}  ·  cliente v{device.version}</div>
            {stage === 1 && (
              <>
                <div style={{ color: '#34d399' }}>✓ canal seguro establecido — sesión #s_{Math.floor(Math.random()*99999)}</div>
                <div style={{ color: '#fbbf24' }}>ⓘ se notificó al cajero antes de iniciar control remoto</div>
              </>
            )}
            {stage === 0 && <div style={{ color: '#94a3b8' }}>...<span style={{ animation: 'pulse 1s infinite', color: '#fbbf24' }}>▮</span></div>}
          </div>
          {stage === 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
              <button className="btn btn-sm" style={{ background: '#15171c', border: '1px solid #2e3138', color: '#e2e8f0' }}><Icon name="monitor" size={12}/> Pantalla</button>
              <button className="btn btn-sm" style={{ background: '#15171c', border: '1px solid #2e3138', color: '#e2e8f0' }}><Icon name="file" size={12}/> Archivos</button>
              <button className="btn btn-sm" style={{ background: '#15171c', border: '1px solid #2e3138', color: '#e2e8f0' }}><Icon name="terminal" size={12}/> Terminal</button>
              <div style={{ flex: 1 }}/>
              <button className="btn btn-sm" onClick={onClose} style={{ background: '#7f1d1d', border: '1px solid #991b1b', color: '#fff' }}>Finalizar sesión</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
