import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.jsx';
import { api } from '../services/api.js';
import { createSignalingClient } from '../services/signaling.js';
import './Remote.css';

export default function Remote() {
  const { posId } = useParams();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  const [pos, setPos] = useState(null);
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [connState, setConnState] = useState('idle'); // idle | connecting | waiting-agent | negotiating | connected | reconnecting | error
  const [agentStatus, setAgentStatus] = useState('unknown'); // unknown | online | offline
  const [timer, setTimer] = useState('00:00:00');
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState({ latencyMs: '--', fps: '--', recvKbps: '--', sendKbps: '--', resolution: '--' });

  const timerRef = useRef(null);
  const secondsRef = useRef(0);
  const peerRef = useRef(null);
  const sigRef = useRef(null);
  const videoRef = useRef(null);
  const dcRef = useRef(null);
  const prevStats = useRef({});
  const statsIntervalRef = useRef(null);
  const mountedRef = useRef(true);
  const screenResolutionRef = useRef({ width: 1920, height: 1080 }); // Default

  // Carga inicial: POS + sesión + status del agent
  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const [p, s, a] = await Promise.all([
          api.getPos(posId),
          api.crearSesion(posId),
          api.getAgentStatus(posId).catch(() => ({ connected: false })),
        ]);
        if (cancelled) return;
        setPos(p);
        setSession(s);
        setAgentStatus(a.connected ? 'online' : 'offline');
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    })();
    return () => {
      cancelled = true;
      mountedRef.current = false;
      cleanupConnection();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posId]);

  // Polling del estado del agent cada 5s mientras no estemos conectados
  useEffect(() => {
    if (connState === 'connected' || connState === 'negotiating') return;
    const t = setInterval(async () => {
      try {
        const a = await api.getAgentStatus(posId);
        if (mountedRef.current) setAgentStatus(a.connected ? 'online' : 'offline');
      } catch {}
    }, 5000);
    return () => clearInterval(t);
  }, [posId, connState]);

  const startTimer = () => {
    secondsRef.current = 0;
    setTimer('00:00:00');
    timerRef.current = setInterval(() => {
      secondsRef.current++;
      const h = String(Math.floor(secondsRef.current / 3600)).padStart(2, '0');
      const m = String(Math.floor((secondsRef.current % 3600) / 60)).padStart(2, '0');
      const s = String(secondsRef.current % 60).padStart(2, '0');
      setTimer(`${h}:${m}:${s}`);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startStatsPolling = () => {
    statsIntervalRef.current = setInterval(async () => {
      const pc = peerRef.current;
      if (!pc) return;
      try {
        const report = await pc.getStats();
        const now = Date.now();

        report.forEach((s) => {
          if (s.type === 'inbound-rtp' && s.kind === 'video') {
            const dtMs = now - (prevStats.current.ts || now);
            const dtFrames = s.framesDecoded - (prevStats.current.framesDecoded || s.framesDecoded);
            const dtBytes = s.bytesReceived - (prevStats.current.bytesReceived || s.bytesReceived);
            const fps = dtMs > 0 ? Math.round((dtFrames / dtMs) * 1000) : 0;
            const kbps = dtMs > 0 ? Math.round((dtBytes * 8) / dtMs) : 0;
            prevStats.current = { ts: now, framesDecoded: s.framesDecoded, bytesReceived: s.bytesReceived };
            const res = s.frameWidth && s.frameHeight ? `${s.frameWidth}x${s.frameHeight}` : '--';
            setStats((prev) => ({ ...prev, fps, recvKbps: kbps, resolution: res }));
          }
          if (s.type === 'candidate-pair' && s.nominated) {
            const rtt = Math.round((s.currentRoundTripTime || 0) * 1000);
            setStats((prev) => ({ ...prev, latencyMs: rtt }));
          }
        });
      } catch {}
    }, 2000);
  };

  const stopStatsPolling = () => {
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }
  };

  const sendInput = (type, data) => {
    if (dcRef.current?.readyState === 'open') {
      try {
        dcRef.current.send(JSON.stringify({ type, ...data }));
      } catch {}
    }
  };

  const cleanupConnection = () => {
    stopTimer();
    stopStatsPolling();
    if (peerRef.current) {
      try { peerRef.current.close(); } catch {}
      peerRef.current = null;
    }
    if (sigRef.current) {
      try { sigRef.current.close(); } catch {}
      sigRef.current = null;
    }
    dcRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const startConnection = async () => {
    if (!session?.sessionId || !session?.iceServers) {
      showToast('⚠️ Sesión no inicializada');
      return;
    }
    if (agentStatus !== 'online') {
      showToast('⚠️ El agent no está conectado en el POS');
      return;
    }

    setConnState('connecting');
    showToast('🔗 Conectando...');

    try {
      const sig = createSignalingClient({
        onClose: () => {
          if (!mountedRef.current) return;
          if (connState === 'connected') {
            setConnState('reconnecting');
            showToast('⚠️ Conexión perdida — reconectando');
          }
        },
        onReconnect: () => {
          if (!mountedRef.current) return;
          showToast('🔄 Reconectado al servidor');
          // Re-join session
          sig.send({ type: 'join', sessionId: session.sessionId, payload: { role: 'browser', posId } });
        },
      });
      sigRef.current = sig;

      sig.on('joined', () => {
        if (mountedRef.current) {
          setConnState('waiting-agent');
          showToast('⏳ Esperando agent en el POS...');
        }
      });

      sig.on('agent-offline', ({ message }) => {
        if (!mountedRef.current) return;
        setConnState('error');
        setAgentStatus('offline');
        showToast('❌ ' + message);
      });

      sig.on('agent-disconnected', () => {
        if (!mountedRef.current) return;
        setAgentStatus('offline');
        setConnState('error');
        showToast('❌ El agent del POS se desconectó');
      });

      // Timeout de 15s esperando offer del agent
      const offerTimeoutId = setTimeout(() => {
        if (sigRef.current && connState === 'waiting-agent') {
          if (mountedRef.current) {
            setConnState('error');
            showToast('❌ Agent no respondió — verifica que esté instalado en el POS');
          }
        }
      }, 15000);

      sig.on('offer', async ({ payload }) => {
        clearTimeout(offerTimeoutId);
        if (!mountedRef.current) return;
        setConnState('negotiating');
        try {
          const pc = new RTCPeerConnection({
            iceServers: session.iceServers,
            iceCandidatePoolSize: 4,
          });
          peerRef.current = pc;

          pc.ontrack = ({ streams, track }) => {
            console.log('[WebRTC] ontrack event:', { trackKind: track?.kind, streamCount: streams.length });
            if (videoRef.current && streams[0]) {
              console.log('[WebRTC] Setting video srcObject, stream has', streams[0].getTracks().length, 'tracks');
              videoRef.current.srcObject = streams[0];
              videoRef.current.play().catch((e) => console.error('[WebRTC] play error:', e.message));
            } else {
              console.warn('[WebRTC] Missing videoRef or streams', { videoRef: !!videoRef.current, streams: streams.length });
            }
          };

          pc.ondatachannel = ({ channel }) => {
            dcRef.current = channel;
            channel.onopen = () => console.log('[WebRTC] DataChannel open');
            channel.onclose = () => console.log('[WebRTC] DataChannel closed');
          };

          pc.onicecandidate = ({ candidate }) => {
            if (candidate) {
              sig.send({ type: 'ice-candidate', sessionId: session.sessionId, payload: candidate });
            }
          };

          pc.oniceconnectionstatechange = () => {
            const state = pc.iceConnectionState;
            console.log('[WebRTC] ICE state:', state);
            if (!mountedRef.current) return;
            if (state === 'connected' || state === 'completed') {
              setConnState('connected');
              startTimer();
              startStatsPolling();
              showToast('✅ Sesión activa');
            }
            if (state === 'disconnected') {
              setConnState('reconnecting');
              showToast('⚠️ Conexión inestable');
            }
            if (state === 'failed') {
              setConnState('error');
              showToast('❌ Conexión WebRTC falló');
            }
            if (state === 'closed') {
              setConnState('idle');
            }
          };

          pc.onicecandidateerror = (event) => {
            console.warn('[WebRTC] ICE error:', event.errorText, event.url);
          };

          await pc.setRemoteDescription(new RTCSessionDescription(payload));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sig.send({ type: 'answer', sessionId: session.sessionId, payload: answer });
        } catch (err) {
          console.error('[WebRTC] offer error:', err);
          if (mountedRef.current) {
            setConnState('error');
            showToast('❌ Error en negociación: ' + err.message);
          }
        }
      });

      sig.on('ice-candidate', async ({ payload }) => {
        try {
          if (peerRef.current && payload) {
            // Ignorar candidates sin sdpMid/sdpMLineIndex (son inválidos)
            if (!payload.candidate || (!payload.sdpMid && !payload.sdpMLineIndex)) {
              return;
            }
            await peerRef.current.addIceCandidate(new RTCIceCandidate(payload));
          }
        } catch (err) {
          console.warn('[WebRTC] ICE candidate error:', err.message);
        }
      });

      sig.on('screen-resolution', ({ payload }) => {
        if (payload?.width && payload?.height) {
          screenResolutionRef.current = payload;
          console.log('[WebRTC] ✓ Screen resolution recibida:', payload);
          if (videoRef.current) {
            const rect = videoRef.current.getBoundingClientRect();
            console.log('[WebRTC] Video element rect:', {
              width: rect.width,
              height: rect.height,
              aspect: (rect.width / rect.height).toFixed(2),
            });
            console.log('[WebRTC] Remote screen aspect:', (payload.width / payload.height).toFixed(2));
          }
        }
      });

      sig.on('error', ({ message }) => {
        if (!mountedRef.current) return;
        showToast('❌ ' + message);
      });

      sig.onOpen(() => {
        sig.send({ type: 'join', sessionId: session.sessionId, payload: { role: 'browser', posId } });
      });
    } catch (err) {
      console.error('[startConnection]', err);
      if (mountedRef.current) {
        setConnState('error');
        showToast('❌ Error: ' + err.message);
      }
    }
  };

  const endSession = () => {
    if (window.confirm(`¿Terminar la sesión remota con POS #${pos.numero}?`)) {
      cleanupConnection();
      setConnState('idle');
      api.terminarSesion(session.sessionId);
      showToast('🔌 Sesión terminada');
    }
  };

  const retryConnection = () => {
    cleanupConnection();
    setConnState('idle');
    setTimeout(() => startConnection(), 300);
  };

  const toggleFullscreen = (e) => {
    const frame = document.getElementById('remote-frame');
    if (!document.fullscreenElement) {
      frame.requestFullscreen().catch(() => {});
      e.target.textContent = '⛶ Salir pantalla completa';
    } else {
      document.exitFullscreen();
      e.target.textContent = '⛶ Pantalla completa';
    }
  };

  const copyId = () => {
    const text = `POS${pos.numero}-${pos.empresaNombre}-${pos.ip}`;
    navigator.clipboard.writeText(text).then(() => {
      showToast('📋 ID copiado al portapapeles');
    });
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const performAction = (msg) => showToast(msg);

  if (error) {
    return (
      <div className="remote-error">
        <div className="error-content">
          <h2>Error al cargar sesión</h2>
          <p>{error}</p>
          <button onClick={() => navigate(-1)}>← Volver</button>
        </div>
      </div>
    );
  }

  if (!pos || !session) {
    return (
      <div className="remote-loading">
        <div className="spinner"></div>
        <span>Preparando sesión remota...</span>
      </div>
    );
  }

  const isConnected = connState === 'connected';
  const isNegotiating = connState === 'connecting' || connState === 'waiting-agent' || connState === 'negotiating';
  const isReconnecting = connState === 'reconnecting';
  const isError = connState === 'error';

  const connStateLabel = {
    idle: 'Listo',
    connecting: 'Conectando',
    'waiting-agent': 'Esperando agent',
    negotiating: 'Negociando',
    connected: 'En vivo',
    reconnecting: 'Reconectando',
    error: 'Error',
  }[connState];

  return (
    <div className={['remote-container', theme === 'dark' ? 'dark' : ''].join(' ')}>
      <div className="topbar">
        <div className="topbar-logo">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="url(#g)" />
            <path d="M8 12h16M8 16h10M8 20h13" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            <circle cx="24" cy="20" r="4" fill="#22c55e" />
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#4f46e5" />
                <stop offset="1" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
          </svg>
          DPSDESK
        </div>

        <div className="divider"></div>

        <div className="session-info">
          <div className="device-badge">
            <span className="dot"></span>
            POS #{pos.numero} — {pos.empresaNombre}
          </div>
          <span className="meta-chip">{pos.ip}</span>
          <span className="meta-chip">{pos.localNombre}</span>
          <span className={`meta-chip ${agentStatus === 'online' ? 'agent-online' : 'agent-offline'}`}>
            ● Agent {agentStatus === 'online' ? 'online' : agentStatus === 'offline' ? 'offline' : '...'}
          </span>
        </div>

        <div className="topbar-actions">
          <button className="btn btn-ghost" onClick={toggle}>
            {theme === 'dark' ? '☀️ Claro' : '🌙 Oscuro'}
          </button>
          <button className="btn btn-ghost" onClick={copyId}>📋 Copiar ID</button>
          <button className="btn btn-ghost" id="btn-fullscreen" onClick={toggleFullscreen}>⛶ Pantalla completa</button>
          <button className="btn btn-danger" onClick={endSession}>✕ Terminar sesión</button>
        </div>
      </div>

      <div className="main">
        <aside className="sidebar">
          <div className="timer-wrap">
            <div>
              <div className="timer-label">Duración sesión</div>
              <div className="timer-val">{timer}</div>
            </div>
            <div className={`status-pill ${isConnected ? 'online' : isError ? 'offline' : ''}`}>
              ● {connStateLabel}
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-label">Dispositivo</div>
            <div className="info-row"><span className="key">🏢 Empresa</span><span className="val">{pos.empresaNombre}</span></div>
            <div className="info-row"><span className="key">📍 Local</span><span className="val">{pos.localNombre}</span></div>
            <div className="info-row"><span className="key">🖥️ POS</span><span className="val">#{pos.numero}</span></div>
            <div className="info-row"><span className="key">🌐 IP</span><span className="val">{pos.ip}</span></div>
            <div className="info-row"><span className="key">📦 Versión</span><span className="val">{pos.version}</span></div>
            <div className="info-row">
              <span className="key">Estado POS</span>
              <span className={`status-pill ${pos.estado}`}>● {pos.estado === 'online' ? 'Conectado' : 'Desconectado'}</span>
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-label">Calidad de conexión</div>
            <div className="quality-bar-wrap">
              <div className="quality-bar-bg">
                <div className="quality-bar-fill" style={{
                  width: isConnected ? `${Math.min(100, Math.max(20, 100 - (stats.latencyMs > 200 ? 60 : stats.latencyMs > 100 ? 30 : 0)))}%` : '0%'
                }}></div>
              </div>
              <div className="quality-label">
                <span>{isConnected ? (stats.latencyMs < 50 ? 'Excelente' : stats.latencyMs < 150 ? 'Buena' : 'Regular') : 'En espera'}</span>
                <span>{isConnected ? `${stats.latencyMs}ms` : '0%'}</span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-label">Rendimiento</div>
            <div className="stat-grid">
              <div className="stat-card">
                <div className="s-label">Latencia</div>
                <div className="s-val">{stats.latencyMs}<span className="s-unit">ms</span></div>
              </div>
              <div className="stat-card">
                <div className="s-label">FPS</div>
                <div className="s-val">{stats.fps}</div>
              </div>
              <div className="stat-card">
                <div className="s-label">↓ Recv</div>
                <div className="s-val">{stats.recvKbps}<span className="s-unit">Kb/s</span></div>
              </div>
              <div className="stat-card">
                <div className="s-label">Resolución</div>
                <div className="s-val" style={{ fontSize: '13px' }}>{stats.resolution}</div>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-label">Acciones rápidas</div>
            <div className="quick-actions">
              <button className="action-btn" onClick={() => performAction('📋 Portapapeles compartido')}>
                <span className="icon">📋</span> Compartir portapapeles
              </button>
              <button className="action-btn" onClick={() => performAction('📁 Transferencia de archivos')}>
                <span className="icon">📁</span> Transferir archivos
              </button>
              <button className="action-btn" onClick={() => performAction('🔄 Reiniciando DPS...')}>
                <span className="icon">🔄</span> Reiniciar DPS
              </button>
              <button className="action-btn" onClick={() => performAction('📝 Logs en vivo')}>
                <span className="icon">📝</span> Ver logs en vivo
              </button>
            </div>
          </div>
        </aside>

        <div className="remote-area">
          <div className="remote-toolbar">
            <button className="rtool-btn" onClick={() => sendInput('keydown', { key: 'Control' }) || sendInput('keydown', { key: 'Alt' }) || sendInput('keydown', { key: 'Delete' })}>⌨️ Ctrl+Alt+Del</button>
            <button className="rtool-btn" onClick={() => performAction('Pantalla bloqueada')}>🔒 Bloquear</button>
            <div className="rtool-sep"></div>
            <button className="rtool-btn" onClick={() => performAction('Solo lectura')}>👁️ Solo lectura</button>
            <button className="rtool-btn" onClick={() => performAction('Captura guardada')}>📸 Captura</button>
            <div className="rtool-sep"></div>
            <button className="rtool-btn" onClick={() => performAction('Grabación iniciada')}>⏺️ Grabar</button>
          </div>

          <div className="remote-frame" id="remote-frame">
            {connState === 'idle' && (
              <div className="connect-placeholder">
                <div className="big-icon">🖥️</div>
                <h2>POS #{pos.numero} — {pos.empresaNombre}</h2>
                {agentStatus === 'online' ? (
                  <>
                    <p>Click para conectar por WebRTC al POS.</p>
                    <button className="connect-btn-big" onClick={startConnection}>🔗 Iniciar Control Remoto</button>
                  </>
                ) : (
                  <>
                    <p style={{ color: '#ef4444' }}>
                      ⚠️ El agent no está conectado en el POS.<br />
                      Verifica que <b>DPS Desk Agent</b> esté ejecutándose.
                    </p>
                    <button className="connect-btn-big" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                      🔗 Iniciar Control Remoto
                    </button>
                  </>
                )}
                <div style={{ fontSize: '11px', color: 'var(--remote-muted)', marginTop: '12px', fontFamily: 'monospace' }}>
                  Sesión: {session.sessionId.slice(0, 8)}... · Agent: {agentStatus}
                </div>
              </div>
            )}

            {isNegotiating && (
              <div className="spinner-wrap">
                <div className="spinner"></div>
                <span>
                  {connState === 'connecting' && 'Conectando al servidor...'}
                  {connState === 'waiting-agent' && 'Notificando al agent del POS...'}
                  {connState === 'negotiating' && 'Negociando WebRTC...'}
                </span>
              </div>
            )}

            {isReconnecting && (
              <div className="spinner-wrap">
                <div className="spinner"></div>
                <span>Reconectando...</span>
              </div>
            )}

            {isError && (
              <div className="connect-placeholder">
                <div className="big-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: '#ef4444' }}>❌</div>
                <h2>Conexión interrumpida</h2>
                <p>No se pudo establecer o se perdió la conexión.</p>
                <button className="connect-btn-big" onClick={retryConnection}>🔄 Reintentar</button>
              </div>
            )}

            {(isConnected || isReconnecting || connState === 'negotiating') && (
              <video
                ref={videoRef}
                className="remote-video"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  cursor: 'crosshair',
                  display: isConnected ? 'block' : 'none',
                  background: '#000',
                }}
                muted
                autoPlay
                playsInline
                tabIndex={0}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const containerWidth = rect.width;
                  const containerHeight = rect.height;

                  const screenWidth = screenResolutionRef.current.width;
                  const screenHeight = screenResolutionRef.current.height;

                  // Calcular el factor de escala para 'cover' fitment
                  const videoAspect = screenWidth / screenHeight;
                  const containerAspect = containerWidth / containerHeight;

                  let displayWidth = containerWidth;
                  let displayHeight = containerHeight;
                  let offsetX = 0;
                  let offsetY = 0;

                  if (videoAspect > containerAspect) {
                    // Video más ancho que container - recortado en top/bottom
                    displayWidth = containerWidth;
                    displayHeight = containerWidth / videoAspect;
                    offsetY = (containerHeight - displayHeight) / 2;
                  } else {
                    // Video más alto que container - recortado en left/right
                    displayHeight = containerHeight;
                    displayWidth = containerHeight * videoAspect;
                    offsetX = (containerWidth - displayWidth) / 2;
                  }

                  // Posición del mouse relativa al video mostrado
                  const relX = e.clientX - rect.left - offsetX;
                  const relY = e.clientY - rect.top - offsetY;

                  // Normalizar a rango 0-1
                  let x = relX / displayWidth;
                  let y = relY / displayHeight;

                  // Limitar a 0-1 (en caso que el mouse esté fuera del video)
                  x = Math.max(0, Math.min(1, x));
                  y = Math.max(0, Math.min(1, y));

                  // Logging cada 20 movimientos para no saturar consola
                  if (Math.random() < 0.05) {
                    console.log('[Mouse Coords]', {
                      screenRes: `${screenWidth}x${screenHeight}`,
                      containerAspect: containerAspect.toFixed(2),
                      videoAspect: videoAspect.toFixed(2),
                      displayDims: `${Math.round(displayWidth)}x${Math.round(displayHeight)}`,
                      offset: `(${Math.round(offsetX)}, ${Math.round(offsetY)})`,
                      normalized: `(${x.toFixed(3)}, ${y.toFixed(3)})`,
                    });
                  }

                  sendInput('mousemove', { x, y });
                }}
                onMouseDown={(e) => sendInput('mousedown', { button: e.button })}
                onMouseUp={(e) => sendInput('mouseup', { button: e.button })}
                onWheel={(e) => sendInput('wheel', { deltaY: e.deltaY })}
                onKeyDown={(e) => {
                  e.preventDefault();
                  sendInput('keydown', { key: e.key, code: e.code });
                }}
                onKeyUp={(e) => sendInput('keyup', { key: e.key, code: e.code })}
                onContextMenu={(e) => e.preventDefault()}
              />
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className="toast show">
          <span className="t-icon">ℹ️</span>
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
