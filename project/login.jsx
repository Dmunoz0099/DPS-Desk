/* global React */
const { useState } = React;

function LoginScreen({ onLogin, dark, onToggleDark }) {
  const [email, setEmail] = useState('admin@digitalpharma.cl');
  const [password, setPassword] = useState('admin');
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e?.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Ingresa usuario y contraseña');
      return;
    }
    setLoading(true);
    try {
      if (window.API) {
        await window.API.login(email, password);
      }
      onLogin();
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg" style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1.05fr 1fr',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative blobs */}
      <div className="blob" style={{ width: 480, height: 480, top: -120, right: -80, background: 'var(--accent-500)' }}/>
      <div className="blob" style={{ width: 380, height: 380, bottom: -120, left: -100, background: 'var(--accent-700)', opacity: 0.3 }}/>

      {/* Top bar with theme toggle */}
      <div style={{
        position: 'absolute', top: 24, right: 28, zIndex: 5,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span className="chip ok"><span className="status-dot ok"/>API · 12 ms</span>
        <button className="btn btn-ghost" style={{ height: 32, width: 32, padding: 0, justifyContent: 'center' }} onClick={onToggleDark}>
          <Icon name={dark ? 'sun' : 'moon'} size={15}/>
        </button>
      </div>

      {/* LEFT: brand + value prop */}
      <div style={{
        padding: '64px 72px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        position: 'relative', zIndex: 2,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--accent-500), var(--accent-700))',
            display: 'grid', placeItems: 'center', color: '#fff',
            boxShadow: '0 8px 24px -6px color-mix(in oklab, var(--accent-600) 50%, transparent)',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h4l3-9 4 18 3-9h4"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.005em' }}>Digital Pharmacy Solutions</div>
            <div style={{ fontSize: 11, color: 'var(--fg-subtle)' }}>Operations Platform</div>
          </div>
        </div>

        <div style={{ maxWidth: 540 }}>
          <div className="chip accent" style={{ marginBottom: 20 }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: 'currentColor' }}/>
            DPS DESK · v4.2 — Centro de operaciones
          </div>
          <h1 style={{
            fontSize: 'clamp(38px, 4.6vw, 60px)',
            lineHeight: 1.05,
            letterSpacing: '-0.035em',
            fontWeight: 600,
            margin: 0,
            color: 'var(--fg)',
          }}>
            Monitoreo y control remoto<br/>
            de <span style={{
              background: 'linear-gradient(120deg, var(--accent-500), var(--accent-700))',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
            }}>terminales POS</span><br/>
            distribuidos.
          </h1>
          <p style={{ fontSize: 16, color: 'var(--fg-muted)', marginTop: 20, lineHeight: 1.55, maxWidth: 480 }}>
            Una sola consola para administrar a distancia toda la red de farmacias —
            sucursales, dispositivos, sesiones y políticas — con telemetría en vivo.
          </p>

          {/* Live tile previews */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 36, maxWidth: 520 }}>
            {[
              { label: 'POS activos',     value: '63',     trend: '+2', dot: 'ok' },
              { label: 'Sesiones / hora', value: '142',    trend: '+18%', dot: 'ok' },
              { label: 'Latencia media',  value: '38ms',   trend: '-4ms', dot: 'ok' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: 14 }}>
                <div style={{ fontSize: 10, color: 'var(--fg-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{s.label}</div>
                <div className="num" style={{ fontSize: 22, fontWeight: 600, marginTop: 6, letterSpacing: '-0.02em' }}>{s.value}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                  <span className={`status-dot ${s.dot}`}/>
                  <span style={{ fontSize: 11, color: 'var(--ok)' }}>{s.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--fg-subtle)' }}>
          <span>© 2026 Digital Pharmacy Solutions</span>
          <span>·</span>
          <a style={{ color: 'inherit', textDecoration: 'none' }} href="#">Términos</a>
          <a style={{ color: 'inherit', textDecoration: 'none' }} href="#">Privacidad</a>
          <a style={{ color: 'inherit', textDecoration: 'none' }} href="#">Estado del sistema ↗</a>
        </div>
      </div>

      {/* RIGHT: form */}
      <div style={{
        padding: '64px 72px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', zIndex: 2,
      }}>
        <form onSubmit={submit} style={{
          width: '100%', maxWidth: 400,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 32,
          boxShadow: 'var(--shadow-lg)',
        }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Bienvenido de vuelta</h2>
          <p style={{ margin: '6px 0 28px', fontSize: 13, color: 'var(--fg-muted)' }}>
            Inicia sesión para acceder al centro de operaciones.
          </p>

          <label style={{ display: 'block', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 500 }}>Usuario o correo</span>
            </div>
            <div style={{ position: 'relative' }}>
              <Icon name="mail" size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-subtle)' }}/>
              <input
                className="input"
                style={{ paddingLeft: 36 }}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@empresa.cl"
              />
            </div>
          </label>

          <label style={{ display: 'block', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 500 }}>Contraseña</span>
              <a href="#" style={{ fontSize: 12, color: 'var(--accent-600)', textDecoration: 'none' }}>¿Olvidaste tu contraseña?</a>
            </div>
            <div style={{ position: 'relative' }}>
              <Icon name="lock" size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-subtle)' }}/>
              <input
                className="input"
                style={{ paddingLeft: 36, paddingRight: 36 }}
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowPwd(s => !s)} className="btn-ghost" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', padding: 4, borderRadius: 4, color: 'var(--fg-subtle)' }}>
                <Icon name={showPwd ? 'eyeOff' : 'eye'} size={14}/>
              </button>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22, fontSize: 13, color: 'var(--fg-muted)', cursor: 'pointer' }}>
            <span
              onClick={() => setRemember(r => !r)}
              style={{
                width: 16, height: 16, borderRadius: 4,
                border: '1px solid ' + (remember ? 'var(--accent-600)' : 'var(--border-strong)'),
                background: remember ? 'var(--accent-600)' : 'transparent',
                display: 'grid', placeItems: 'center',
                transition: 'all 120ms ease',
              }}
            >
              {remember && <Icon name="check" size={11} style={{ color: '#fff' }} stroke={3}/>}
            </span>
            <span onClick={() => setRemember(r => !r)}>Mantener sesión iniciada</span>
          </label>

          {error && (
            <div style={{
              marginBottom: 14,
              padding: '8px 10px',
              borderRadius: 6,
              background: 'var(--err-bg, #fee2e2)',
              color: 'var(--err, #b91c1c)',
              fontSize: 12,
              border: '1px solid color-mix(in oklab, var(--err, #b91c1c) 30%, transparent)',
            }}>{error}</div>
          )}

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? <><span className="spinner" style={{ borderTopColor: '#fff' }}/> Verificando…</> : <>Iniciar sesión <Icon name="arrowRt" size={14}/></>}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0', color: 'var(--fg-subtle)', fontSize: 11 }}>
            <hr className="hr" style={{ flex: 1 }}/>
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>O continúa con</span>
            <hr className="hr" style={{ flex: 1 }}/>
          </div>

          <button type="button" className="btn btn-lg" style={{ width: '100%', justifyContent: 'center', gap: 10 }}>
            <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.35 11.1H12v3.2h5.36c-.23 1.4-1.66 4.1-5.36 4.1-3.23 0-5.86-2.67-5.86-5.96S8.77 6.5 12 6.5c1.84 0 3.07.78 3.78 1.45l2.58-2.5C16.79 3.96 14.6 3 12 3 6.93 3 2.83 7.05 2.83 12.1S6.93 21.2 12 21.2c6.93 0 9.5-4.86 9.5-7.36 0-.5-.05-.92-.15-1.74Z"/></svg>
            Continuar con Google Network
          </button>

          <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--border)', textAlign: 'center', fontSize: 13, color: 'var(--fg-muted)' }}>
            ¿Eres nuevo? <button type="button" onClick={() => setShowRegister(true)} style={{ color: 'var(--accent-600)', fontWeight: 500 }}>Solicita acceso</button>
          </div>
        </form>
      </div>

      {/* Bottom captcha-ish badge */}
      <div style={{
        position: 'absolute', bottom: 18, right: '50%', transform: 'translateX(50%)',
        padding: '6px 12px', borderRadius: 999,
        background: 'var(--surface)', border: '1px solid var(--border)',
        fontSize: 11, color: 'var(--fg-muted)',
        display: 'flex', alignItems: 'center', gap: 8,
        boxShadow: 'var(--shadow-sm)',
      }}>
        <Icon name="shieldCk" size={12} style={{ color: 'var(--ok)' }}/>
        Protegido por Turnstile · sesión cifrada AES-256
      </div>

      {showRegister && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 50 }} onClick={() => setShowRegister(false)}>
          <div onClick={e => e.stopPropagation()} className="card" style={{ width: 400, padding: 28 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Solicita acceso</h3>
            <p style={{ fontSize: 13, color: 'var(--fg-muted)', marginTop: 6 }}>Tu administrador recibirá una notificación para aprobar tu cuenta.</p>
            <input className="input" placeholder="correo@empresa.cl" style={{ marginTop: 16 }}/>
            <input className="input" placeholder="Empresa / sucursal" style={{ marginTop: 10 }}/>
            <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
              <button className="btn" style={{ flex: 1 }} onClick={() => setShowRegister(false)}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setShowRegister(false)}>Enviar solicitud</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.LoginScreen = LoginScreen;
