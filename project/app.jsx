/* global React, ReactDOM */
const { useState, useEffect, useRef, useCallback } = React;

// =============================================================
// DPS DESK — Main App: Login + Shell + Routing + Tweaks + Modal
// Visual language: v2 "Operations Terminal" — plum + lime on warm paper.
// =============================================================

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "density": "comfortable"
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  const [logged, setLogged] = useState(!!(window.API && window.API.getToken && window.API.getToken()));
  const [profile, setProfile] = useState(null);
  const [route, setRoute] = useState('dashboard');
  const [connectingDevice, setConnectingDevice] = useState(null);
  const [, setDataVersion] = useState(0);
  const [apiStatus, setApiStatus] = useState(null); // 'ok' | 'fallback' | null
  const [recentOpen, setRecentOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [networkInitialCompany, setNetworkInitialCompany] = useState(null);

  // Apply tweaks to <html>
  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('dark', !!tweaks.dark);
    html.classList.remove('density-compact', 'density-spacious');
    if (tweaks.density === 'compact') html.classList.add('density-compact');
    if (tweaks.density === 'spacious') html.classList.add('density-spacious');
  }, [tweaks]);

  // Cargar datos reales del backend cuando hay sesión iniciada.
  const refreshData = useCallback(async () => {
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

  // Cargar perfil del usuario logueado
  useEffect(() => {
    if (!logged || !window.API?.me) return;
    let alive = true;
    window.API.me().then((u) => {
      if (!alive) return;
      const fullName = u.nombre || u.name || u.username || u.email || 'Usuario';
      setProfile({
        name: fullName,
        email: u.email || u.username || '',
        role: u.rol || u.role || 'Usuario',
        picture: u.picture || null,
      });
    }).catch(() => {});
    return () => { alive = false; };
  }, [logged]);

  useEffect(() => {
    if (!logged) return;
    refreshData();
    const id = setInterval(() => {
      if (!connectingDevice) refreshData();
    }, 5000);
    return () => clearInterval(id);
  }, [logged, refreshData, connectingDevice]);

  const handleLogout = () => {
    if (window.API) window.API.clearToken();
    setLogged(false);
    setProfile(null);
    setRoute('dashboard');
  };

  // ── Login ──────────────────────────────────────────────────────────────
  if (!logged) {
    return (
      <>
        <LoginScreen
          onLogin={(payload) => {
            // payload puede venir del login local o del flujo OAuth Google
            if (payload && payload.email) {
              setProfile({
                name: payload.name || payload.email,
                email: payload.email,
                picture: payload.picture || null,
                role: payload.role || 'Usuario',
              });
            }
            setLogged(true);
          }}
          dark={tweaks.dark}
          onToggleDark={() => setTweak('dark', !tweaks.dark)}
        />
        <DesignTweaks tweaks={tweaks} setTweak={setTweak}/>
      </>
    );
  }

  // ── Header meta (num/section/title/kicker) por pantalla ──
  const meta = {
    dashboard: {
      num: '01', section: 'DASHBOARD',
      title: <>Centro de <span className="italic-d">control</span></>,
      kicker: apiStatus === 'fallback' ? 'Backend desconectado · mostrando estado local.' : 'Vista en vivo de la red de POS — refresco cada 5 s.',
    },
    network: {
      num: '02', section: 'EMPRESAS',
      title: <>Red de <span className="italic-d">empresas</span></>,
      kicker: 'Tres niveles: empresa → local → dispositivo. Filtros y búsqueda activos.',
    },
    audit: {
      num: '03', section: 'AUDITORÍA',
      title: <>Registro <span className="italic-d">completo</span></>,
      kicker: 'Toda la actividad del panel — sesiones, dispositivos, accesos. Exportable en CSV.',
    },
    config: {
      num: '04', section: 'AJUSTES',
      title: <>Ajustes del <span className="italic-d">sistema</span></>,
      kicker: 'Identidad, seguridad, equipo y backend.',
    },
  }[route];

  // Datos para el chip de usuario en la TopNav
  const initials = (profile?.name || 'Usuario').split(/\s+/).map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'U';
  const userObj = {
    name: profile?.name || 'Usuario',
    email: profile?.email || '',
    initials,
  };

  const navigateTo = (to) => {
    if (to === 'network') setNetworkInitialCompany(null);
    setRoute(to);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--paper)' }}>
      <Sidebar
        active={route}
        onNavigate={navigateTo}
        onLogout={handleLogout}
        onOpenRecent={() => setRecentOpen(true)}
      />
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <TopNav
          section={meta.section}
          num={meta.num}
          title={meta.title}
          kicker={meta.kicker}
          dark={tweaks.dark}
          onToggleDark={() => setTweak('dark', !tweaks.dark)}
          actions={null}
          user={userObj}
          onProfile={() => setProfileOpen(true)}
          onPreferences={() => setRoute('config')}
          onSecurity={() => setRoute('config')}
          onHelp={() => setHelpOpen(true)}
          onLogout={handleLogout}
        />
        {route === 'dashboard' && (
          <DashboardScreen
            onNavigate={navigateTo}
            onConnect={setConnectingDevice}
            onOpenCompany={(companyId) => { setNetworkInitialCompany(companyId); setRoute('network'); }}
          />
        )}
        {route === 'network' && (
          <NetworkScreen
            initialCompany={networkInitialCompany}
            onConnect={setConnectingDevice}
            onRefresh={refreshData}
          />
        )}
        {route === 'audit' && (
          <AuditScreen profile={profile}/>
        )}
        {route === 'config' && (
          <ConfigScreen profile={profile} onProfileChange={setProfile} apiStatus={apiStatus}/>
        )}
      </main>
      <DesignTweaks tweaks={tweaks} setTweak={setTweak}/>

      {connectingDevice && (
        <ConnectingModal device={connectingDevice} onClose={() => setConnectingDevice(null)}/>
      )}
      {recentOpen && (
        <RecentSessionsModal
          onClose={() => setRecentOpen(false)}
          onOpen={(d) => { setRecentOpen(false); setConnectingDevice(d); }}
        />
      )}
      {profileOpen && (
        <ProfileModal profile={profile || userObj} initials={initials} onChange={setProfile} onClose={() => setProfileOpen(false)}/>
      )}
      {helpOpen && (
        <HelpModal onClose={() => setHelpOpen(false)}/>
      )}
    </div>
  );
}

// =============================================================
// Tweaks (panel flotante de tweaks de diseño)
// =============================================================
function DesignTweaks({ tweaks, setTweak }) {
  const { TweaksPanel, TweakSection, TweakRadio } = window;
  if (!TweaksPanel) return null;
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection title="Apariencia">
        <TweakRadio
          label="Tema"
          value={tweaks.dark ? 'dark' : 'light'}
          options={[
            { value: 'light', label: 'Claro' },
            { value: 'dark',  label: 'Oscuro' },
          ]}
          onChange={v => setTweak('dark', v === 'dark')}
        />
        <TweakRadio
          label="Densidad"
          value={tweaks.density}
          options={[
            { value: 'compact',     label: 'Compacta' },
            { value: 'comfortable', label: 'Estándar' },
            { value: 'spacious',    label: 'Amplia' },
          ]}
          onChange={v => setTweak('density', v)}
        />
      </TweakSection>
    </TweaksPanel>
  );
}

// =============================================================
// Modales auxiliares (Recent · Profile · Help)
// =============================================================
function RecentSessionsModal({ onClose, onOpen }) {
  const devices = (window.MOCK?.DEVICES || []).slice(0, 6);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-shell modal-compact" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-head-compact">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontFamily: 'var(--sans)', fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--ink)' }}>
              Sesiones recientes
            </h3>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', marginTop: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Últimos {devices.length} dispositivos vistos
            </div>
          </div>
          <button onClick={onClose} className="btn-icon-close" aria-label="Cerrar">
            <Icon name="x" size={14}/>
          </button>
        </div>
        <div style={{ padding: '8px 0' }}>
          {devices.length === 0 && (
            <div style={{ padding: '32px 24px', textAlign: 'center', fontSize: 12, color: 'var(--ink-mute)' }}>
              Sin dispositivos disponibles aún.
            </div>
          )}
          {devices.map((d) => (
            <button
              key={d.id}
              onClick={() => onOpen(d)}
              disabled={d.status === 'offline'}
              className="recent-row"
              style={d.status === 'offline' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              <span className={'dot ' + (d.status === 'online' ? 'ok' : 'bad')}/>
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{d.name} · {d.company}</div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', marginTop: 2 }}>{d.rustdeskId}</div>
              </div>
              <span className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)' }}>{d.lastSeen || ''}</span>
              <Icon name="chevronR" size={12}/>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileModal({ profile, initials, onChange, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-shell modal-compact" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-head-compact">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontFamily: 'var(--sans)', fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--ink)' }}>
              Mi perfil
            </h3>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', marginTop: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Cuenta · sesión activa
            </div>
          </div>
          <button onClick={onClose} className="btn-icon-close" aria-label="Cerrar">
            <Icon name="x" size={14}/>
          </button>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, paddingBottom: 22, borderBottom: '1px solid var(--line)' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 999,
              background: 'var(--plum)', color: '#FFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 600, letterSpacing: '0.04em',
              backgroundImage: profile?.picture ? `url(${profile.picture})` : undefined,
              backgroundSize: 'cover', backgroundPosition: 'center',
            }}>{!profile?.picture && initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{profile?.name || '—'}</div>
              <div className="mono" style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 4 }}>{profile?.email || '—'}</div>
              <div style={{ marginTop: 8, display: 'inline-flex', gap: 6, alignItems: 'center', padding: '4px 10px', background: 'var(--plum-soft)', color: 'var(--plum)', borderRadius: 999, fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
                {profile?.role || 'Usuario'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, paddingTop: 18 }}>
            <button className="btn" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HelpModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-shell modal-compact" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-head-compact">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontFamily: 'var(--sans)', fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--ink)' }}>
              Soporte
            </h3>
          </div>
          <button onClick={onClose} className="btn-icon-close" aria-label="Cerrar">
            <Icon name="x" size={14}/>
          </button>
        </div>
        <div style={{ padding: 24 }}>
          <a href="mailto:soporte@digitalpharma.cl" className="help-card" style={{ display: 'block' }}>
            <Icon name="mail" size={18}/>
            <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600 }}>Contactar soporte</div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', marginTop: 4, lineHeight: 1.4 }}>
              soporte@digitalpharma.cl · L–V 8:00–22:00
            </div>
          </a>
        </div>
      </div>
    </div>
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
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef     = useRef(null);
  const videoRef         = useRef(null);
  const overlayRef       = useRef(null);
  const wsRef            = useRef(null);
  const pcRef            = useRef(null);
  const dcRef            = useRef(null);
  const sidRef           = useRef(null);
  const remoteStreamRef  = useRef(null); // guarda el stream hasta que el <video> esté en el DOM
  const moveRafRef       = useRef(null); // rAF id para throttling de mousemove
  const lastMovePosRef   = useRef(null); // último (x,y) normalizado pendiente de envío

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  // Sync state cuando el usuario sale con Esc / F11 / etc.
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

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
          const pc = new RTCPeerConnection({ iceServers, bundlePolicy: 'max-bundle', iceCandidatePoolSize: 4 });
          pcRef.current = pc;

          pc.ontrack = ({ track, streams, receiver }) => {
            addLog(`✓ Track ${track.kind} recibido`);
            if (track.kind === 'video') {
              // Bajar el jitter buffer del receptor a ~0 ms. Por defecto el
              // navegador acumula 100-200 ms de frames para suavizar la
              // reproducción — para control remoto interactivo eso es lag puro.
              try { receiver.playoutDelayHint = 0; } catch {}
              try { receiver.jitterBufferTarget = 0; } catch {}
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
            // 'disconnected' es transitorio y puede volver a 'connected' solo —
            // tratarlo como terminal generaba falsos "se perdió la conexión".
            // Solo 'failed' es definitivo.
            if (pc.connectionState === 'failed' && !cancelled) {
              setErrorMsg('La conexión WebRTC falló. Verifica la red del PC remoto.');
              setStage('error');
            }
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

  // Permitir cerrar el modal con Escape SOLO cuando todavía no estamos en sesión.
  // Una vez conectados, Escape es una tecla legítima que debe ir al PC remoto;
  // si la dejábamos atada a window, pulsar Esc en el remoto cerraba la sesión.
  useEffect(() => {
    if (stage === 'connected') return;
    const onKey = (e) => { if (e.key === 'Escape') finalize(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendInput = (msg) => {
    const dc = dcRef.current;
    if (dc && dc.readyState === 'open') {
      try { dc.send(JSON.stringify(msg)); } catch {}
    }
  };

  // Mapear el cursor a coordenadas normalizadas [0..1] del frame REAL del video,
  // teniendo en cuenta el letterboxing de object-fit: contain. Sin esto, el agente
  // mueve el cursor al lugar equivocado en el remoto (lo que se siente como
  // "no puedo controlar toda la pantalla / hay un límite de movimiento").
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const relPos = (e) => {
    const v = videoRef.current;
    if (!v) return { x: 0, y: 0 };
    const rect = v.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
    const vw = v.videoWidth, vh = v.videoHeight;
    if (!vw || !vh) {
      return {
        x: clamp01((e.clientX - rect.left) / rect.width),
        y: clamp01((e.clientY - rect.top) / rect.height),
      };
    }
    const elementAspect = rect.width / rect.height;
    const videoAspect = vw / vh;
    let dispW, dispH, offX, offY;
    if (elementAspect > videoAspect) {
      // Letterbox a izquierda/derecha
      dispH = rect.height;
      dispW = dispH * videoAspect;
      offX = (rect.width - dispW) / 2;
      offY = 0;
    } else {
      // Letterbox arriba/abajo
      dispW = rect.width;
      dispH = dispW / videoAspect;
      offX = 0;
      offY = (rect.height - dispH) / 2;
    }
    return {
      x: clamp01((e.clientX - rect.left - offX) / dispW),
      y: clamp01((e.clientY - rect.top - offY) / dispH),
    };
  };

  // Throttle de mousemove con rAF: si llegan 200 eventos/seg los colapsamos al
  // último por frame para no saturar el data channel ni la cola de robotjs.
  const queueMove = (e) => {
    lastMovePosRef.current = relPos(e);
    if (moveRafRef.current != null) return;
    moveRafRef.current = requestAnimationFrame(() => {
      moveRafRef.current = null;
      const pos = lastMovePosRef.current;
      if (pos) sendInput({ type: 'mousemove', ...pos });
    });
  };

  // Liberar el rAF al desmontar
  useEffect(() => () => {
    if (moveRafRef.current != null) cancelAnimationFrame(moveRafRef.current);
  }, []);

  const statusDot   = stage === 'connected' ? '#C5F23E' : stage === 'error' ? '#EF4444' : '#F59E0B';
  const statusLabel = stage === 'connected' ? 'Sesión activa' : stage === 'error' ? 'Error de conexión' : 'Conectando…';

  return (
    <div ref={containerRef} style={{ position: 'fixed', inset: 0, background: 'rgba(8, 6, 16, 0.92)', backdropFilter: 'blur(6px)', zIndex: 60, display: 'flex', flexDirection: 'column' }}>
      {/* Header — chrome v2 (oscuro pero con tipografía y acentos plum/lime) */}
      <div style={{
        background: '#0E0B1A',
        borderBottom: '1px solid #221C36',
        padding: '12px 22px',
        display: 'flex', alignItems: 'center', gap: 14,
        flexShrink: 0,
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: 999, background: statusDot,
          boxShadow: `0 0 0 4px ${statusDot}33`,
        }}/>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: '#E5E0F2', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{statusLabel}</span>
        <span style={{ width: 1, height: 18, background: '#221C36' }}/>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#FFFFFF' }}>{device.name}</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#8077A8', letterSpacing: '0.06em' }}>{device.rustdeskId}</span>
        {sessionId && (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#5E5380', marginLeft: 'auto', letterSpacing: '0.08em' }}>#{sessionId.slice(0, 8)}</span>
        )}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Salir de pantalla completa (Esc)' : 'Pantalla completa'}
          style={{
            marginLeft: sessionId ? 12 : 'auto',
            padding: '6px 10px', borderRadius: 6,
            background: 'rgba(107, 79, 255, 0.12)',
            border: '1px solid rgba(107, 79, 255, 0.4)',
            color: '#A89BFF',
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: 'var(--mono)',
            fontSize: 11, fontWeight: 600,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'background 120ms ease',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(107, 79, 255, 0.22)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(107, 79, 255, 0.12)'}
        >
          <Icon name={isFullscreen ? 'shrink' : 'expand'} size={13}/>
          {isFullscreen ? 'Salir' : 'Pantalla completa'}
        </button>
        <button
          onClick={finalize}
          style={{
            padding: '6px 14px', borderRadius: 6,
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#FCA5A5',
            fontFamily: 'var(--mono)',
            fontSize: 11, fontWeight: 600,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'background 120ms ease',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.22)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'}
        >
          Desconectar
        </button>
      </div>

      {/* Body */}
      {stage !== 'connected' ? (
        /* Connecting / Error — panel pulido manteniendo tema oscuro */
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <div style={{
            width: 680,
            background: '#15102A',
            border: '1px solid #2A2342',
            borderRadius: 14,
            boxShadow: '0 32px 80px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(107, 79, 255, 0.1) inset',
            overflow: 'hidden',
          }}>
            {/* Card header */}
            <div style={{ padding: '20px 26px', borderBottom: '1px solid #2A2342', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: stage === 'error' ? 'rgba(239, 68, 68, 0.18)' : 'rgba(107, 79, 255, 0.22)',
                color: stage === 'error' ? '#FCA5A5' : '#A89BFF',
                display: 'grid', placeItems: 'center',
              }}>
                {stage === 'error' ? <Icon name="x" size={16}/> : <Icon name="zap" size={16}/>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600, color: '#8077A8', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  Sesión remota · {device.name}
                </div>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 18, fontWeight: 600, color: '#FFFFFF', marginTop: 4, letterSpacing: '-0.01em' }}>
                  {stage === 'error' ? 'No fue posible establecer la conexión' : 'Negociando enlace seguro…'}
                </div>
              </div>
            </div>

            {/* Logs — terminal */}
            <div style={{ padding: '20px 26px', fontFamily: 'var(--mono)', background: '#0C0820' }}>
              {logs.map((l, i) => {
                const ok   = l.startsWith('✓');
                const warn = l.startsWith('✗') || l.startsWith('⚠');
                return (
                  <div key={i} style={{
                    fontSize: 12, lineHeight: 1.75,
                    color: ok ? '#C5F23E' : warn ? '#F59E0B' : '#A89BFF',
                    letterSpacing: '0.02em',
                  }}>{l}</div>
                );
              })}
              {stage === 'connecting' && (
                <div style={{ color: '#C5F23E', fontSize: 12, marginTop: 4, animation: 'pulse 1.2s ease-in-out infinite' }}>▮</div>
              )}
            </div>

            {/* Error panel */}
            {stage === 'error' && (
              <div style={{ padding: '0 26px 22px' }}>
                <div style={{
                  padding: '12px 14px',
                  borderRadius: 8,
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#FCA5A5',
                  fontSize: 12, lineHeight: 1.5,
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                }}>
                  <Icon name="info" size={14} style={{ flexShrink: 0, marginTop: 1 }}/>
                  <span>{errorMsg}</span>
                </div>
                <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
                  <button
                    onClick={finalize}
                    style={{
                      flex: 1, padding: '11px 14px', borderRadius: 8,
                      background: '#211B36',
                      border: '1px solid #2A2342',
                      color: '#E5E0F2',
                      fontSize: 13, fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: 'var(--sans)',
                      transition: 'background 120ms ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#2A2342'}
                    onMouseLeave={e => e.currentTarget.style.background = '#211B36'}
                  >
                    Cerrar sesión
                  </button>
                </div>
                <div style={{ marginTop: 10, fontFamily: 'var(--mono)', fontSize: 10, color: '#5E5380', textAlign: 'center', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  o presiona Esc
                </div>
              </div>
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
          {/* Mostramos el cursor local del navegador: el desktopCapturer de
              Electron NO incluye el cursor en los frames capturados, así que
              sin esto no se vería ningún puntero. Como el agente mueve el
              cursor remoto a la misma posición que el local (vía relPos),
              ambos quedan sincronizados visualmente. */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', touchAction: 'none', userSelect: 'none', cursor: 'default' }}
            onPointerMove={queueMove}
            onPointerDown={e => {
              e.preventDefault();
              // setPointerCapture asegura que recibimos el pointerup aunque el
              // usuario suelte fuera del <video> (al arrastrar para mover/minimizar
              // ventanas). Sin esto, el agente nunca veía el mouseup y el botón
              // se quedaba "pegado" en el PC remoto.
              try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
              try { overlayRef.current?.focus(); } catch {}
              sendInput({ type: 'mousedown', button: e.button, ...relPos(e) });
            }}
            onPointerUp={e => {
              try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
              sendInput({ type: 'mouseup', button: e.button, ...relPos(e) });
            }}
            onPointerCancel={e => {
              try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
              sendInput({ type: 'mouseup', button: e.button || 0, ...relPos(e) });
            }}
            onLostPointerCapture={e => {
              // Si el navegador nos quita la captura por cualquier motivo
              // (foco perdido, alt-tab, etc.) liberamos los 3 botones para
              // que el remoto no se quede arrastrando.
              [0, 1, 2].forEach(button => sendInput({ type: 'mouseup', button, ...relPos(e) }));
            }}
            onContextMenu={e => e.preventDefault()}
            onWheel={e => { e.preventDefault(); sendInput({ type: 'wheel', deltaX: e.deltaX, deltaY: e.deltaY }); }}
          />
          {/* Cursor hint */}
          <div style={{
            position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
            padding: '6px 14px', borderRadius: 999,
            background: 'rgba(14, 11, 26, 0.85)',
            border: '1px solid rgba(107, 79, 255, 0.25)',
            color: '#C5F23E',
            fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            pointerEvents: 'none',
            backdropFilter: 'blur(8px)',
          }}>
            Click para capturar teclado
          </div>
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
