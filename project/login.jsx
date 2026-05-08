/* global React */
const { useState, useEffect, useRef } = React;

// =============================================================
// LoginScreen — Usuario/contraseña (primario) + Google OAuth (secundario)
// =============================================================
function LoginScreen({ onLogin, dark, onToggleDark }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError]       = useState('');
  const [busy, setBusy]         = useState(false);
  const [gisReady, setGisReady] = useState(false);
  const [showCfg, setShowCfg]   = useState(false);
  const [clientId, setClientId] = useState((window.API?.getGoogleClientId?.() || ''));
  const btnContainerRef         = useRef(null);

  const hasClientId = !!clientId;

  async function handleSubmit(e) {
    e.preventDefault();
    if (busy) return;
    if (!username.trim() || !password.trim()) {
      setError('Ingresa usuario y contraseña');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const r = await window.API.login(username.trim(), password);
      onLogin({
        name:    r?.user?.name     || r?.user?.username || username.trim(),
        email:   r?.user?.email    || '',
        picture: r?.user?.picture  || null,
        role:    r?.user?.role     || 'Administrador',
      });
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión');
    } finally {
      setBusy(false);
    }
  }

  // Espera a que el script de Google Identity Services esté disponible.
  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      if (window.google && window.google.accounts && window.google.accounts.id) {
        setGisReady(true);
        return;
      }
      setTimeout(tick, 200);
    };
    tick();
    return () => { cancelled = true; };
  }, []);

  // Inicializa GIS y renderiza el botón cuando está todo listo.
  useEffect(() => {
    if (!gisReady || !hasClientId || !btnContainerRef.current) return;
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredential,
        auto_select: false,
        ux_mode: 'popup',
        itp_support: true,
      });
      btnContainerRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(btnContainerRef.current, {
        type: 'standard',
        theme: dark ? 'filled_black' : 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: 320,
      });
    } catch (err) {
      setError('No se pudo inicializar Google Identity: ' + err.message);
    }
  }, [gisReady, hasClientId, clientId, dark]);

  async function handleCredential(resp) {
    if (!resp || !resp.credential) {
      setError('Google no devolvió credencial');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const r = await window.API.loginWithGoogle(resp.credential);
      onLogin({
        name:    r?.user?.name    || r?.user?.email,
        email:   r?.user?.email,
        picture: r?.user?.picture || null,
        role:    r?.user?.role    || 'Usuario',
      });
    } catch (err) {
      setError(err.message || 'No se pudo verificar la sesión con Google');
    } finally {
      setBusy(false);
    }
  }

  function saveClientId() {
    const trimmed = clientId.trim();
    window.API?.setGoogleClientId?.(trimmed);
    setClientId(trimmed);
    setShowCfg(false);
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--paper)',
      color: 'var(--ink)',
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 1fr)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background grid + acid blob */}
      <div className="grid-bg" style={{
        position: 'absolute', inset: 0, opacity: 0.55, pointerEvents: 'none',
      }}/>
      <div style={{
        position: 'absolute',
        right: -180, top: -160,
        width: 520, height: 520, borderRadius: '50%',
        background: 'radial-gradient(circle at 30% 30%, var(--lime) 0%, transparent 65%)',
        opacity: 0.4, filter: 'blur(8px)', pointerEvents: 'none',
      }}/>
      <div style={{
        position: 'absolute',
        left: -200, bottom: -180,
        width: 480, height: 480, borderRadius: '50%',
        background: 'radial-gradient(circle at 60% 60%, var(--plum) 0%, transparent 65%)',
        opacity: 0.18, filter: 'blur(10px)', pointerEvents: 'none',
      }}/>

      {/* TOP-RIGHT controls */}
      <div style={{
        position: 'absolute', top: 22, right: 28, zIndex: 5,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <button
          onClick={() => setShowCfg(s => !s)}
          className="btn btn-sm"
          title="Configurar Google Client ID"
        >
          <Icon name="settings" size={12}/> Client ID
        </button>
        <button
          className="btn btn-sm"
          style={{ width: 32, padding: 0, justifyContent: 'center' }}
          onClick={onToggleDark}
          aria-label="Cambiar tema"
        >
          <Icon name={dark ? 'sun' : 'moon'} size={13}/>
        </button>
      </div>

      {/* LEFT — brand + value prop */}
      <div style={{
        padding: '64px 72px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        position: 'relative', zIndex: 2,
        borderRight: '1px solid var(--line)',
      }}>
        <div>
          {window.BrandLockup && <BrandLockup markSize={50} variant="desk"/>}
        </div>

        <div style={{ maxWidth: 540 }}>
          <div className="serial" style={{ marginBottom: 18 }}>
            <span style={{ width: 18, height: 1, background: 'var(--ink-mute)' }}/>
            DPS DESK · v4.2 — CENTRO DE OPERACIONES
          </div>
          <h1 className="display" style={{
            fontSize: 'clamp(40px, 5vw, 64px)',
            lineHeight: 0.96,
            margin: 0,
          }}>
            Monitoreo y control<br/>
            remoto de <span className="italic-d">terminales POS</span><br/>
            distribuidos.
          </h1>
          <p style={{
            fontSize: 16,
            color: 'var(--ink-mute)',
            marginTop: 22,
            lineHeight: 1.55,
            maxWidth: 480,
          }}>
            Una sola consola para administrar a distancia toda la red de farmacias —
            sucursales, dispositivos, sesiones y políticas — con telemetría en vivo.
          </p>

          {/* Live tile previews — placeholders neutros */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            marginTop: 36,
            maxWidth: 520,
          }}>
            {[
              { label: 'POS gestionados',  value: '∞',     hint: 'Sin tope por plan',     dot: 'ok' },
              { label: 'Latencia objetivo', value: '< 60ms', hint: 'p95 panel ↔ agente',    dot: 'ok' },
              { label: 'Cifrado',           value: 'AES‑256', hint: 'Sesión punto a punto', dot: 'ok' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: 16 }}>
                <div className="serial" style={{ fontSize: 10, marginBottom: 8 }}>{s.label}</div>
                <div className="display num" style={{ fontSize: 22, lineHeight: 1, letterSpacing: '-0.02em' }}>{s.value}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  <span className={`dot ${s.dot}`}/>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)' }}>{s.hint}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11, color: 'var(--ink-soft)' }}>
          <span>© 2026 Digital Pharma Solutions</span>
          <span>·</span>
          <span>Términos</span>
          <span>·</span>
          <span>Privacidad</span>
          <span>·</span>
          <span>Estado del sistema ↗</span>
        </div>
      </div>

      {/* RIGHT — login card */}
      <div style={{
        padding: '64px 72px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', zIndex: 2,
      }}>
        <div className="card" style={{
          width: '100%', maxWidth: 420,
          padding: 36,
          background: 'var(--paper-up)',
          boxShadow: '0 24px 48px -16px rgba(20, 16, 36, 0.18)',
        }}>
          <div className="serial" style={{ marginBottom: 14 }}>
            <span style={{ width: 18, height: 1, background: 'var(--ink-mute)' }}/>
            ACCESO · 01
          </div>
          <h2 className="display" style={{ fontSize: 36, margin: 0, lineHeight: 1 }}>
            Bienvenido <span className="italic-d">de vuelta</span>
          </h2>
          <p style={{ margin: '12px 0 24px', fontSize: 13, color: 'var(--ink-mute)', lineHeight: 1.5 }}>
            Ingresa con tus credenciales del panel para administrar tu red de POS.
          </p>

          {/* Username / password form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label className="serial" style={{ fontSize: 10, marginBottom: 6, display: 'block' }}>
                USUARIO
              </label>
              <input
                className="input"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                disabled={busy}
              />
            </div>
            <div>
              <label className="serial" style={{ fontSize: 10, marginBottom: 6, display: 'block' }}>
                CONTRASEÑA
              </label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={busy}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={busy}
              style={{ width: '100%', marginTop: 6, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {busy ? <><span className="spinner"/> Verificando…</> : <>Iniciar sesión</>}
            </button>
          </form>

          {error && (
            <div style={{
              marginTop: 14,
              padding: '10px 12px',
              borderRadius: 'var(--r-sm)',
              background: 'var(--bad-soft)',
              color: 'var(--bad)',
              border: '1px solid var(--bad)',
              fontSize: 12,
              lineHeight: 1.5,
            }}>{error}</div>
          )}

          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            margin: '24px 0 18px',
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--line)' }}/>
            <span className="mono" style={{ fontSize: 10, color: 'var(--ink-soft)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              O continúa con
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--line)' }}/>
          </div>

          {/* Google Sign-In */}
          {hasClientId ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div ref={btnContainerRef} style={{ display: 'flex', justifyContent: 'center', minHeight: 44 }}/>
              {!gisReady && (
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)', textAlign: 'center' }}>
                  Cargando Google Identity…
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="btn"
              onClick={() => setShowCfg(true)}
              style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8, height: 42 }}
            >
              <Icon name="settings" size={13}/>
              Configurar Google Workspace
            </button>
          )}

          <hr className="hr" style={{ margin: '22px 0 16px' }}/>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>¿Sin cuenta?</span>
            <a href="mailto:soporte@digitalpharma.cl" style={{ color: 'var(--plum)', textDecoration: 'none' }}>
              Solicitar acceso ↗
            </a>
          </div>
        </div>
      </div>

      {/* Bottom badge */}
      <div style={{
        position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)',
        padding: '6px 14px', borderRadius: 999,
        background: 'var(--paper-up)', border: '1px solid var(--line-2)',
        fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-mute)',
        display: 'flex', alignItems: 'center', gap: 8, zIndex: 4,
        letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>
        <Icon name="shieldCk" size={11}/>
        Sesión protegida · OAuth 2.0 · AES‑256
      </div>

      {/* Client ID config modal */}
      {showCfg && (
        <div className="modal-overlay" onClick={() => setShowCfg(false)}>
          <div className="modal-shell modal-compact" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-head-compact">
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontFamily: 'var(--sans)', fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--ink)' }}>
                  Google Client ID
                </h3>
                <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', marginTop: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Sólo necesario una vez por navegador
                </div>
              </div>
              <button onClick={() => setShowCfg(false)} className="btn-icon-close" aria-label="Cerrar">
                <Icon name="x" size={14}/>
              </button>
            </div>
            <form className="modal-body-compact" onSubmit={e => { e.preventDefault(); saveClientId(); }}>
              <div className="form-row-compact">
                <label className="form-label-compact">OAuth 2.0 Client ID (Web)</label>
                <input
                  autoFocus
                  className="input-compact mono"
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  placeholder="123-abc.apps.googleusercontent.com"
                  style={{ fontSize: 11 }}
                />
              </div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', lineHeight: 1.6 }}>
                1. Google Cloud Console → APIs & Services → Credentials.<br/>
                2. Crea un <strong style={{ color: 'var(--ink)' }}>OAuth 2.0 Client ID</strong> tipo Web Application.<br/>
                3. Añade <span style={{ color: 'var(--plum)' }}>{window.location.origin}</span> a <em>Authorized JavaScript origins</em>.<br/>
                4. Pega aquí el Client ID generado.
              </div>
              <div className="modal-foot-compact">
                <button type="button" onClick={() => setShowCfg(false)} className="btn-cancel-compact">Cancelar</button>
                <button type="submit" className="btn-save-compact">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

window.LoginScreen = LoginScreen;
