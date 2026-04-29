/* global React, ReactDOM */
const { useState, useEffect, useRef, useCallback } = React;

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
  const [logged, setLogged] = useState(!!(window.API && window.API.getToken && window.API.getToken()));
  const [navHistory, setNavHistory] = useState(['dashboard']);
  const [navIndex, setNavIndex] = useState(0);
  const route = navHistory[navIndex];
  const [collapsed, setCollapsed] = useState(false);
  const [connectingDevice, setConnectingDevice] = useState(null);
  const [, setDataVersion] = useState(0);
  const [apiStatus, setApiStatus] = useState(null); // 'ok' | 'fallback' | null

  const navigate = useCallback((to) => {
    const trimmed = navHistory.slice(0, navIndex + 1);
    if (trimmed[trimmed.length - 1] === to) return;
    const newHist = [...trimmed, to];
    setNavHistory(newHist);
    setNavIndex(newHist.length - 1);
  }, [navHistory, navIndex]);

  const goBack    = useCallback(() => setNavIndex(i => Math.max(0, i - 1)), []);
  const goForward = useCallback(() => setNavIndex(i => Math.min(navHistory.length - 1, i + 1)), [navHistory.length]);

  // Apply tweaks to DOM
  useEffect(() => { applyAccent(tweaks.accent); }, [tweaks.accent]);
  useEffect(() => { applyDensity(tweaks.density); }, [tweaks.density]);
  useEffect(() => { applyRadius(tweaks.radius); }, [tweaks.radius]);
  useEffect(() => { applyDark(tweaks.dark); }, [tweaks.dark]);

  // Cargar datos reales del backend cuando hay sesión iniciada.
  // Si el backend está caído, conservamos los mocks de data.js.
  const refreshData = React.useCallback(async () => {
    if (!window.API) return;
    try {
      const d = await window.API.getNetworkData();
      window.MOCK = Object.assign({}, window.MOCK, d);
      setApiStatus('ok');
      setDataVersion((v) => v + 1);
    } catch (err) {
      console.warn('[DPS] Backend no disponible:', err.message);
      setApiStatus('fallback');
    }
  }, []);

  useEffect(() => {
    if (!logged) return;
    refreshData();
  }, [logged, refreshData]);

  const handleLogout = () => {
    if (window.API) window.API.clearToken();
    setLogged(false);
  };

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
        onNavigate={navigate}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <TopNav
          title={titles[route].t}
          subtitle={titles[route].s}
          dark={tweaks.dark}
          onToggleDark={() => setTweak('dark', !tweaks.dark)}
          onLogout={handleLogout}
          apiStatus={apiStatus}
          canGoBack={navIndex > 0}
          canGoForward={navIndex < navHistory.length - 1}
          onGoBack={goBack}
          onGoForward={goForward}
        />
        <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }}>
          {route === 'dashboard' && <DashboardScreen onNavigate={navigate}/>}
          {route === 'network'   && <NetworkScreen onConnect={setConnectingDevice} onRefresh={refreshData}/>}
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
// "Connecting" modal — WebRTC remote desktop session
// =============================================================
function ConnectingModal({ device, onClose }) {
  const [stage, setStage] = useState('connecting'); // 'connecting' | 'connected' | 'error'
  const [logs, setLogs] = useState([`$ dps-desk connect ${device.rustdeskId}`]);
  const [errorMsg, setErrorMsg] = useState('');
  const [sessionId, setSessionId] = useState(null);

  const videoRef         = useRef(null);
  const overlayRef       = useRef(null);
  const wsRef            = useRef(null);
  const pcRef            = useRef(null);
  const dcRef            = useRef(null);
  const sidRef           = useRef(null);
  const remoteStreamRef  = useRef(null); // guarda el stream hasta que el <video> esté en el DOM

  const addLog = useCallback((msg) => setLogs(l => [...l.slice(-30), msg]), []);

  // Asignar el stream al <video> una vez que stage pasa a 'connected' y el elemento existe
  useEffect(() => {
    if (stage === 'connected' && videoRef.current && remoteStreamRef.current) {
      videoRef.current.srcObject = remoteStreamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [stage]);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (!window.API) { setErrorMsg('API no disponible'); setStage('error'); return; }

      // 1. Crear sesión
      addLog('→ Creando sesión en el backend…');
      let r;
      try {
        r = await window.API.createSession(device.rustdeskId);
      } catch (err) {
        if (cancelled) return;
        setErrorMsg(err.message || 'No se pudo crear la sesión');
        setStage('error');
        return;
      }
      if (cancelled) return;

      const sid = r.sessionId;
      sidRef.current = sid;
      setSessionId(sid);
      addLog(`✓ Sesión ${sid.slice(0, 8)}… creada`);

      // 2. Conectar WS
      const wsUrl = window.API.getWSUrl();
      addLog(`→ Conectando señalización ${wsUrl}`);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) { ws.close(); return; }
        addLog('✓ WebSocket conectado — uniendo sesión…');
        ws.send(JSON.stringify({
          type: 'join',
          sessionId: sid,
          payload: { role: 'browser', posId: device.rustdeskId },
        }));
      };

      ws.onmessage = async (ev) => {
        if (cancelled) return;
        let msg;
        try { msg = JSON.parse(ev.data); } catch { return; }

        if (msg.type === 'joined') {
          addLog('✓ Sesión unida — esperando al agente remoto…');
        }

        if (msg.type === 'agent-offline') {
          addLog('⚠ El agente no está conectado');
          setErrorMsg('El agente está desconectado. Verifica que DPS Desk esté activo en el PC remoto.');
          setStage('error');
        }

        if (msg.type === 'agent-disconnected') {
          addLog('⚠ El agente se desconectó durante la sesión');
          setStage('error');
          setErrorMsg('El agente se desconectó');
        }

        if (msg.type === 'offer') {
          addLog('→ Oferta WebRTC recibida — configurando conexión…');
          const iceServers = r.iceServers || [];
          const pc = new RTCPeerConnection({ iceServers, bundlePolicy: 'max-bundle' });
          pcRef.current = pc;

          pc.ontrack = ({ track, streams }) => {
            addLog(`✓ Track ${track.kind} recibido`);
            if (track.kind === 'video') {
              // Guardar stream — el <video> puede no estar en el DOM todavía
              remoteStreamRef.current = streams[0] || new MediaStream([track]);
              setStage('connected'); // el useEffect lo asigna cuando el elemento exista
            }
          };

          pc.ondatachannel = ({ channel }) => {
            dcRef.current = channel;
            addLog('✓ Canal de input listo');
          };

          pc.onicecandidate = ({ candidate }) => {
            if (candidate && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ice-candidate', payload: candidate }));
            }
          };

          pc.onconnectionstatechange = () => {
            addLog(`WebRTC: ${pc.connectionState}`);
            if (pc.connectionState === 'connected') setStage('connected');
          };

          try {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            ws.send(JSON.stringify({ type: 'answer', payload: answer }));
            addLog('→ Respuesta enviada — negociando ICE…');
          } catch (err) {
            addLog(`✗ Error WebRTC: ${err.message}`);
            setErrorMsg(err.message);
            setStage('error');
          }
        }

        if (msg.type === 'ice-candidate' && msg.payload && pcRef.current) {
          try {
            const { candidate, sdpMid, sdpMLineIndex } = msg.payload;
            if (candidate && (sdpMid !== null || sdpMLineIndex !== null)) {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(msg.payload));
            }
          } catch {}
        }
      };

      ws.onerror = () => {
        if (!cancelled) { setErrorMsg('Error en la conexión WebSocket'); setStage('error'); }
      };
    }

    start();

    return () => {
      cancelled = true;
      wsRef.current?.close();
      pcRef.current?.close();
      sidRef.current && window.API?.deleteSession?.(sidRef.current).catch(() => {});
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus overlay para captura de teclado cuando está conectado
  useEffect(() => {
    if (stage === 'connected') overlayRef.current?.focus();
  }, [stage]);

  const finalize = () => {
    wsRef.current?.close();
    pcRef.current?.close();
    sessionId && window.API?.deleteSession?.(sessionId).catch(() => {});
    onClose();
  };

  const sendInput = (msg) => {
    const dc = dcRef.current;
    if (dc && dc.readyState === 'open') {
      try { dc.send(JSON.stringify(msg)); } catch {}
    }
  };

  const relPos = (e) => {
    const rect = videoRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
  };

  const statusColor = stage === 'connected' ? 'ok' : stage === 'error' ? 'err' : 'warn';
  const statusLabel = stage === 'connected' ? 'Sesión activa' : stage === 'error' ? 'Error de conexión' : 'Conectando…';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(3px)', zIndex: 60, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: '#0d0f12', borderBottom: '1px solid #2a2d35', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <span className={`status-dot ${statusColor}`}/>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>{statusLabel}</span>
        <span style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>{device.name}</span>
        <span style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace' }}>{device.rustdeskId}</span>
        {sessionId && (
          <span style={{ fontSize: 10, color: '#334155', fontFamily: 'monospace', marginLeft: 'auto' }}>#{sessionId.slice(0, 8)}</span>
        )}
        <button
          onClick={finalize}
          style={{ marginLeft: sessionId ? 8 : 'auto', padding: '4px 12px', borderRadius: 6, background: '#7f1d1d', border: '1px solid #991b1b', color: '#fca5a5', fontSize: 12, cursor: 'pointer' }}
        >
          Desconectar
        </button>
      </div>

      {/* Body */}
      {stage !== 'connected' ? (
        /* Connecting / Error terminal */
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <div style={{ width: 660, background: '#0a0b0e', border: '1px solid #1e2128', borderRadius: 12, padding: 28, fontFamily: 'monospace', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}>
            {logs.map((l, i) => (
              <div key={i} style={{ fontSize: 12, lineHeight: 1.7, color: l.startsWith('✓') ? '#34d399' : l.startsWith('✗') || l.startsWith('⚠') ? '#fbbf24' : '#94a3b8' }}>
                {l}
              </div>
            ))}
            {stage === 'error' && (
              <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: '#1c0a0a', border: '1px solid #7f1d1d', color: '#f87171', fontSize: 12 }}>
                ✗ {errorMsg}
              </div>
            )}
            {stage === 'connecting' && (
              <div style={{ color: '#fbbf24', fontSize: 12, marginTop: 4 }}>▮</div>
            )}
          </div>
        </div>
      ) : (
        /* Remote desktop view */
        <div
          ref={overlayRef}
          tabIndex={0}
          style={{ flex: 1, outline: 'none', position: 'relative', background: '#000', display: 'flex', overflow: 'hidden' }}
          onKeyDown={e => { e.preventDefault(); sendInput({ type: 'keydown', key: e.key, code: e.code, ctrlKey: e.ctrlKey, altKey: e.altKey, shiftKey: e.shiftKey }); }}
          onKeyUp={e => { e.preventDefault(); sendInput({ type: 'keyup', key: e.key, code: e.code }); }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', cursor: 'none' }}
            onMouseMove={e => sendInput({ type: 'mousemove', ...relPos(e) })}
            onMouseDown={e => { e.preventDefault(); sendInput({ type: 'mousedown', button: e.button, ...relPos(e) }); }}
            onMouseUp={e => sendInput({ type: 'mouseup', button: e.button, ...relPos(e) })}
            onContextMenu={e => e.preventDefault()}
            onWheel={e => { e.preventDefault(); sendInput({ type: 'wheel', deltaX: e.deltaX, deltaY: e.deltaY }); }}
          />
          {/* Cursor hint */}
          <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', padding: '4px 12px', borderRadius: 999, background: 'rgba(0,0,0,0.6)', color: '#94a3b8', fontSize: 11, pointerEvents: 'none' }}>
            Haz clic en la pantalla para capturar el teclado
          </div>
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
