/* global React */
const { useState, useEffect, useRef } = React;

// 3 editorial slides — each with its own headline, body, and floating data cards.
const LOGIN_SLIDES = [
  {
    edition: 'VOL. 04 — ED. 26.04.26',
    title: ['Centro de', { i: 'operaciones' }, 'para una red', 'de farmacias.'],
    body: 'DPS Desk monitorea, controla y administra a distancia toda la flota de terminales POS — sucursales, dispositivos, sesiones — desde una sola consola.',
    cards: [
      { kind: 'spark', label: 'POS activos', value: '63', sub: 'real-time', delta: '+2',
        series: [54, 56, 55, 58, 60, 59, 61, 62, 63] },
      { kind: 'rings', label: 'Salud de flota', items: [
        { l: 'Online', v: 92, color: 'var(--good)' },
        { l: 'Latencia ok', v: 96, color: 'var(--lime)' },
        { l: 'Uptime', v: 99.4, color: 'var(--plum)' },
      ] },
      { kind: 'big', label: 'Sesiones / hora', value: '142', sub: '+18% vs. ayer', delta: 'up' },
    ],
  },
  {
    edition: 'CAPÍTULO 02 — CONTROL REMOTO',
    title: ['Toma el control', { i: 'sin moverte' }, 'del escritorio.'],
    body: 'Conecta a cualquier POS de la red en segundos. Diagnostica, repara y entrena al equipo sin pisar la sucursal — con auditoría completa de cada sesión.',
    cards: [
      { kind: 'session', label: 'Sesión activa', pos: 'POS-04 · Providencia', state: 'Conectado', duration: '02:14' },
      { kind: 'big', label: 'TTC mediana', value: '2.4', unit: 's', sub: 'time-to-connect', delta: 'down-good' },
      { kind: 'bars', label: 'Sesiones por día', items: [
        { l: 'L', v: 28 }, { l: 'M', v: 34 }, { l: 'M', v: 31 }, { l: 'J', v: 42 }, { l: 'V', v: 38 }, { l: 'S', v: 19 }, { l: 'D', v: 12 },
      ], total: '204 sem.' },
    ],
  },
  {
    edition: 'CAPÍTULO 03 — INTELIGENCIA DE FLOTA',
    title: ['Cada caída', { i: 'se anticipa' }, 'antes de pasar.'],
    body: 'Heartbeats por dispositivo, alertas por sucursal y un mapa de la operación en tiempo real. Decisiones con datos, no con llamadas a las 3am.',
    cards: [
      { kind: 'donut', label: 'Alertas por tipo', segments: [
        { l: 'Conectividad', v: 38, color: 'var(--bad)' },
        { l: 'Latencia',     v: 28, color: 'var(--warn)' },
        { l: 'Hardware',     v: 22, color: 'var(--plum)' },
        { l: 'Otros',        v: 12, color: 'var(--ink-mute)' },
      ], center: { v: '4.2', k: '/día' } },
      { kind: 'big', label: 'MTTR mediana', value: '11', unit: 'min', sub: '−38% vs. mes', delta: 'down-good' },
      { kind: 'map', label: 'Cobertura', regions: '7', locales: '47', devices: '63' },
    ],
  },
];

const SLIDE_INTERVAL = 6500;

// === Floating cards ===
function sparkPath(values, w, h, pad = 4) {
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  return values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
}

function DataCard({ card, style, className }) {
  const base = {
    background: 'var(--paper-up)',
    border: '1px solid var(--line)',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 16px 36px -14px rgba(14,14,16,0.22), 0 2px 6px rgba(14,14,16,0.05)',
    ...style,
  };

  if (card.kind === 'spark') {
    const w = 240, h = 56;
    return (
      <div className={className} style={base}>
        <div className="serial" style={{ fontSize: 11 }}>{card.label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6 }}>
          <span className="display num" style={{ fontSize: 42 }}>{card.value}</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--good)' }}>↑ {card.delta}</span>
        </div>
        <svg width={w} height={h} style={{ display: 'block', marginTop: 10 }}>
          <path d={sparkPath(card.series, w, h)} stroke="var(--lime)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <path d={`${sparkPath(card.series, w, h)} L${w-4} ${h-4} L4 ${h-4} Z`} fill="var(--lime)" opacity="0.18"/>
        </svg>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 4 }}>{card.sub}</div>
      </div>
    );
  }

  if (card.kind === 'rings') {
    return (
      <div className={className} style={base}>
        <div className="serial" style={{ fontSize: 11, marginBottom: 14 }}>{card.label}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {card.items.map(it => (
            <div key={it.l} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <svg width="28" height="28" viewBox="0 0 22 22">
                <circle cx="11" cy="11" r="8.5" stroke="var(--line)" strokeWidth="2" fill="none"/>
                <circle cx="11" cy="11" r="8.5" stroke={it.color} strokeWidth="2" fill="none"
                  strokeDasharray={`${(it.v / 100) * 53.4} 53.4`}
                  strokeLinecap="round"
                  transform="rotate(-90 11 11)"/>
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <span className="mono" style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{it.l}</span>
              </div>
              <span className="display num" style={{ fontSize: 20 }}>{it.v}<span className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)' }}>%</span></span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (card.kind === 'big') {
    const arrow = card.delta === 'up' ? '↑' : card.delta === 'down-good' ? '↓' : '→';
    const arrowColor = card.delta === 'up' || card.delta === 'down-good' ? 'var(--good)' : 'var(--ink-soft)';
    return (
      <div className={className} style={base}>
        <div className="serial" style={{ fontSize: 11 }}>{card.label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 12 }}>
          <span className="display num" style={{ fontSize: 60, lineHeight: 0.9 }}>{card.value}</span>
          {card.unit && <span className="mono" style={{ fontSize: 16, color: 'var(--ink-mute)' }}>{card.unit}</span>}
        </div>
        <div className="mono" style={{ fontSize: 11, color: arrowColor, marginTop: 10 }}>
          {arrow} {card.sub}
        </div>
      </div>
    );
  }

  if (card.kind === 'session') {
    return (
      <div className={className} style={base}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="serial" style={{ fontSize: 11 }}>{card.label}</div>
          <span className="dot-wrap" style={{ color: 'var(--good)' }}>
            <span className="dot ok live"/>
          </span>
        </div>
        <div className="mono" style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 600 }}>{card.pos}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTop: '1px dashed var(--line)' }}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--good)' }}>● {card.state}</span>
          <span className="display num" style={{ fontSize: 18 }}>{card.duration}</span>
        </div>
      </div>
    );
  }

  if (card.kind === 'bars') {
    const max = Math.max(...card.items.map(b => b.v));
    return (
      <div className={className} style={base}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div className="serial" style={{ fontSize: 11 }}>{card.label}</div>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{card.total}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 70 }}>
          {card.items.map((b, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: '100%',
                height: `${(b.v / max) * 100}%`,
                background: i === 3 ? 'var(--lime)' : 'var(--ink)',
                borderRadius: 3,
                minHeight: 4,
              }}/>
              <span className="mono" style={{ fontSize: 10, color: 'var(--ink-soft)' }}>{b.l}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (card.kind === 'donut') {
    const total = card.segments.reduce((a, b) => a + b.v, 0);
    const C = 2 * Math.PI * 22;
    let offset = 0;
    return (
      <div className={className} style={base}>
        <div className="serial" style={{ fontSize: 11, marginBottom: 12 }}>{card.label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <svg width="82" height="82" viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
            {card.segments.map((s, i) => {
              const len = (s.v / total) * C;
              const dash = `${len} ${C - len}`;
              const dashOffset = -offset;
              offset += len;
              return (
                <circle key={i} cx="32" cy="32" r="22"
                  fill="none" stroke={s.color} strokeWidth="9"
                  strokeDasharray={dash} strokeDashoffset={dashOffset}
                  transform="rotate(-90 32 32)"/>
              );
            })}
            <text x="32" y="31" textAnchor="middle" fontSize="15" fontWeight="600" fill="var(--ink)" fontFamily="var(--display)">{card.center.v}</text>
            <text x="32" y="42" textAnchor="middle" fontSize="7" fill="var(--ink-soft)" fontFamily="var(--mono)">{card.center.k}</text>
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
            {card.segments.map((s) => (
              <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: s.color, flexShrink: 0 }}/>
                <span className="mono" style={{ color: 'var(--ink-mute)', flex: 1 }}>{s.l}</span>
                <span className="mono" style={{ color: 'var(--ink)' }}>{s.v}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (card.kind === 'map') {
    return (
      <div className={className} style={base}>
        <div className="serial" style={{ fontSize: 11, marginBottom: 12 }}>{card.label}</div>
        <svg width="200" height="76" viewBox="0 0 160 60" style={{ display: 'block' }} preserveAspectRatio="xMidYMid meet">
          <path d="M82 4 L84 8 L83 14 L85 20 L83 26 L86 32 L84 38 L87 44 L85 50 L88 56" stroke="var(--line-2)" strokeWidth="1" fill="none" strokeDasharray="2 2"/>
          {[
            { x: 84, y: 8 },  { x: 86, y: 18 }, { x: 84, y: 26 },
            { x: 87, y: 34 }, { x: 85, y: 42 }, { x: 88, y: 50 }, { x: 86, y: 56 },
          ].map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r="2.6" fill="var(--lime)" stroke="var(--ink)" strokeWidth="0.8"/>
          ))}
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--line)' }}>
          <div><div className="display num" style={{ fontSize: 22 }}>{card.regions}</div><div className="mono" style={{ fontSize: 10, color: 'var(--ink-soft)' }}>regiones</div></div>
          <div><div className="display num" style={{ fontSize: 22 }}>{card.locales}</div><div className="mono" style={{ fontSize: 10, color: 'var(--ink-soft)' }}>locales</div></div>
          <div><div className="display num" style={{ fontSize: 22 }}>{card.devices}</div><div className="mono" style={{ fontSize: 10, color: 'var(--ink-soft)' }}>POS</div></div>
        </div>
      </div>
    );
  }
  return null;
}

// Three slot positions for the floating cards. Each card lands here based on order.
const CARD_SLOTS = [
  { left: '2%',   bottom: 0,   rotate: -3, z: 3, w: 290 },
  { left: '34%',  bottom: 70,  rotate: 1.5, z: 2, w: 270 },
  { right: '2%',  bottom: 12,  rotate: 2.5, z: 3, w: 290 },
];

function LoginCarousel({ idx, setIdx }) {
  const slide = LOGIN_SLIDES[idx];
  return (
    <>
      {/* Editorial body — animates in/out per slide */}
      <div key={idx} className="login-slide" style={{ position: 'relative', maxWidth: 620 }}>
        <h1 className="display" style={{ margin: 0, fontSize: 'clamp(40px, 5.4vw, 76px)', letterSpacing: '-0.028em', lineHeight: 1.02 }}>
          {slide.title.map((part, i) => {
            if (typeof part === 'string') {
              return (
                <React.Fragment key={i}>
                  {part}
                  {i === 1 && (
                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 999, background: 'var(--lime)', verticalAlign: 'middle', marginLeft: 12, marginBottom: 12 }}/>
                  )}
                  {i < slide.title.length - 1 && <br/>}
                </React.Fragment>
              );
            }
            return (
              <React.Fragment key={i}>
                <span className="italic-d" style={{ fontStyle: 'italic' }}>{part.i}</span>
                {i < slide.title.length - 1 && <br/>}
              </React.Fragment>
            );
          })}
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--ink-mute)', marginTop: 22, maxWidth: 460 }}>
          {slide.body}
        </p>
      </div>

      {/* Pagination + floating data cards stage */}
      <div style={{ position: 'relative' }}>
        {/* dots + counter */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {LOGIN_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Ir al capítulo ${i + 1}`}
                style={{
                  border: 'none', padding: 0, cursor: 'pointer',
                  width: i === idx ? 36 : 8, height: 8, borderRadius: 999,
                  background: 'var(--line-2)',
                  transition: 'all 280ms cubic-bezier(.4,0,.2,1)',
                  position: 'relative', overflow: 'hidden',
                }}
              >
                {i === idx && (
                  <span
                    key={`fill-${idx}`}
                    style={{
                      position: 'absolute', inset: 0,
                      background: 'var(--plum)',
                      animation: `dotFill ${SLIDE_INTERVAL}ms linear forwards`,
                      transformOrigin: 'left',
                    }}
                  />
                )}
              </button>
            ))}
            <span className="serial" style={{ marginLeft: 14, fontSize: 10 }}>
              {String(idx + 1).padStart(2, '0')} / {String(LOGIN_SLIDES.length).padStart(2, '0')}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setIdx((idx - 1 + LOGIN_SLIDES.length) % LOGIN_SLIDES.length)}
              className="btn btn-sm"
              aria-label="Capítulo anterior"
              style={{ width: 30, padding: 0, justifyContent: 'center' }}
            >
              <Icon name="arrowLt" size={12}/>
            </button>
            <button
              onClick={() => setIdx((idx + 1) % LOGIN_SLIDES.length)}
              className="btn btn-sm"
              aria-label="Capítulo siguiente"
              style={{ width: 30, padding: 0, justifyContent: 'center' }}
            >
              <Icon name="arrowRt" size={12}/>
            </button>
          </div>
        </div>

        {/* Floating cards stage */}
        <div key={`stage-${idx}`} className="login-stage" style={{ position: 'relative', height: 280, marginTop: 8 }}>
          {slide.cards.map((card, i) => {
            const slot = CARD_SLOTS[i] || CARD_SLOTS[0];
            return (
              <div
                key={`${idx}-${i}`}
                className="float-card"
                style={{
                  position: 'absolute',
                  left: slot.left, right: slot.right, bottom: slot.bottom,
                  width: slot.w,
                  zIndex: slot.z,
                  transform: `rotate(${slot.rotate}deg)`,
                  animation: `cardEnter 700ms cubic-bezier(.2,.7,.2,1) ${i * 110}ms both`,
                }}
              >
                <DataCard card={card}/>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function LoginScreen({ onLogin, dark, onToggleDark }) {
  const [email, setEmail] = useState('admin@digitalpharma.cl');
  const [pwd, setPwd] = useState('••••••••••');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);
  const [oauthBusy, setOauthBusy] = useState(null); // 'google' | 'microsoft' | null
  const [oauthErr, setOauthErr] = useState(null);
  const [handed, setHanded] = useState(() => {
    try { return localStorage.getItem('LOGIN_HANDED') === 'left' ? 'left' : 'right'; }
    catch (e) { return 'right'; }
  });
  const toggleHanded = () => {
    setHanded(h => {
      const next = h === 'left' ? 'right' : 'left';
      try { localStorage.setItem('LOGIN_HANDED', next); } catch (e) {}
      return next;
    });
  };
  const userInteractedRef = useRef(false);

  // Auto-rotate carousel; pauses for 12s after manual interaction.
  useEffect(() => {
    const id = setInterval(() => {
      if (!userInteractedRef.current) {
        setSlideIdx((i) => (i + 1) % LOGIN_SLIDES.length);
      }
    }, SLIDE_INTERVAL);
    return () => clearInterval(id);
  }, []);

  const onPick = (i) => {
    userInteractedRef.current = true;
    setSlideIdx(i);
    // resume autoplay after a pause
    setTimeout(() => { userInteractedRef.current = false; }, 12000);
  };

  const submit = (e) => {
    e?.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 700);
  };

  const handleOAuth = async (provider) => {
    if (oauthBusy) return;
    setOauthErr(null);
    setOauthBusy(provider);
    try {
      const auth = window.AUTH;
      if (!auth) throw new Error('auth.js no cargó.');
      const profile = provider === 'google'
        ? await auth.signInWithGoogle()
        : await auth.signInWithMicrosoft();
      onLogin(profile);
    } catch (e) {
      setOauthErr((e && e.message) || String(e));
      setOauthBusy(null);
    }
  };

  const isLeft = handed === 'left';

  return (
    <div style={{
      minHeight: '100vh', display: 'grid',
      gridTemplateColumns: isLeft ? '1fr 1.1fr' : '1.1fr 1fr',
      background: 'var(--paper)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Editorial carousel side */}
      <div style={{
        gridColumn: isLeft ? 2 : 1,
        gridRow: 1,
        padding: '24px 48px',
        borderRight: isLeft ? 'none' : '1px solid var(--line)',
        borderLeft: isLeft ? '1px solid var(--line)' : 'none',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        position: 'relative',
        gap: 18,
        maxHeight: '100vh',
        overflowY: 'auto',
      }}>
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none', maskImage: 'radial-gradient(ellipse at top right, #000 0%, transparent 70%)' }}/>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
          <span className="serial" style={{ fontSize: 10 }}>Operations · DPS Desk</span>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }}/>
          <button
            className="btn"
            onClick={toggleHanded}
            title={isLeft ? 'Cambiar a diestro' : 'Cambiar a zurdo'}
            style={{ height: 38, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, letterSpacing: '0.04em' }}
          >
            <span style={{ display: 'inline-grid', gridTemplateColumns: '4px 4px', gridTemplateRows: '4px 4px', gap: 2 }}>
              {[0,1,2,3].map(i => <span key={i} style={{ background: 'currentColor', borderRadius: 1 }}/>)}
            </span>
            {isLeft ? 'Zurdo' : 'Diestro'}
          </button>
          <button
            className="btn"
            onClick={onToggleDark}
            title={dark ? 'Tema claro' : 'Tema oscuro'}
            style={{ height: 38, width: 38, padding: 0, justifyContent: 'center', display: 'flex', alignItems: 'center' }}
          >
            <Icon name={dark ? 'sun' : 'moon'} size={16}/>
          </button>
        </div>

        <LoginCarousel idx={slideIdx} setIdx={onPick}/>
      </div>

      {/* Form side */}
      <div style={{
        gridColumn: isLeft ? 1 : 2,
        gridRow: 1,
        padding: '24px 56px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        background: 'var(--paper-2)',
        position: 'relative',
        maxHeight: '100vh',
        overflowY: 'auto',
      }}>
        <div className="serial" style={{ alignSelf: 'flex-end', fontSize: 10 }}>
          ⏣ access.dpsdesk.cl · TLS 1.3
        </div>

        <form onSubmit={submit} style={{ width: '100%', maxWidth: 380, alignSelf: 'center', margin: '20px 0' }}>
          <div style={{ marginBottom: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
            <BrandMark size={120}/>
            <div style={{
              fontFamily: 'var(--sans)',
              fontSize: 34,
              fontWeight: 700,
              color: 'var(--ink)',
              letterSpacing: '-0.035em',
              lineHeight: 1,
              display: 'flex',
              alignItems: 'baseline',
              gap: 10,
              justifyContent: 'center',
            }}>
              <span>DPS</span>
              <span>Desk<span style={{ color: '#6B4FFF' }}>.</span></span>
            </div>
          </div>
          <label style={{ display: 'block', marginBottom: 14 }}>
            <div className="serial" style={{ marginBottom: 6 }}>Usuario / correo</div>
            <input className="input mono" value={email} onChange={e => setEmail(e.target.value)} style={{ fontSize: 13 }}/>
          </label>

          <label style={{ display: 'block', marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span className="serial">Contraseña</span>
              <a href="#" className="serial" style={{ color: 'var(--plum)', textDecoration: 'none' }}>¿olvidaste?</a>
            </div>
            <div style={{ position: 'relative' }}>
              <input className="input mono" type={show ? 'text' : 'password'} value={pwd} onChange={e => setPwd(e.target.value)} style={{ fontSize: 13, paddingRight: 36 }}/>
              <button type="button" onClick={() => setShow(s => !s)} className="btn-ghost" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', padding: 4, color: 'var(--ink-mute)' }}>
                <Icon name={show ? 'eyeOff' : 'eye'} size={13}/>
              </button>
            </div>
          </label>

          <button type="submit" className="btn btn-acid btn-lg" style={{ width: '100%', justifyContent: 'space-between', marginTop: 8 }} disabled={loading}>
            {loading ? <><span className="spinner"/> Verificando…</> : <>Iniciar sesión <Icon name="arrowRt" size={14}/></>}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0', color: 'var(--ink-soft)', fontSize: 10 }}>
            <span className="hr" style={{ flex: 1, background: 'var(--line)', height: 1 }}/>
            <span className="mono" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>O continúa con</span>
            <span className="hr" style={{ flex: 1, background: 'var(--line)', height: 1 }}/>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button
              type="button"
              className="btn"
              onClick={() => handleOAuth('google')}
              disabled={oauthBusy !== null || loading}
              style={{ justifyContent: 'center', gap: 8 }}
            >
              {oauthBusy === 'google'
                ? <span className="spinner"/>
                : <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.35 11.1H12v3.2h5.36c-.23 1.4-1.66 4.1-5.36 4.1-3.23 0-5.86-2.67-5.86-5.96S8.77 6.5 12 6.5c1.84 0 3.07.78 3.78 1.45l2.58-2.5C16.79 3.96 14.6 3 12 3 6.93 3 2.83 7.05 2.83 12.1S6.93 21.2 12 21.2c6.93 0 9.5-4.86 9.5-7.36 0-.5-.05-.92-.15-1.74Z"/></svg>}
              {oauthBusy === 'google' ? 'Conectando…' : 'Google'}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => handleOAuth('microsoft')}
              disabled={oauthBusy !== null || loading}
              style={{ justifyContent: 'center', gap: 8 }}
            >
              {oauthBusy === 'microsoft'
                ? <span className="spinner"/>
                : <svg width="13" height="13" viewBox="0 0 24 24"><path fill="#F25022" d="M2 2h10v10H2z"/><path fill="#7FBA00" d="M12 2h10v10H12z"/><path fill="#00A4EF" d="M2 12h10v10H2z"/><path fill="#FFB900" d="M12 12h10v10H12z"/></svg>}
              {oauthBusy === 'microsoft' ? 'Conectando…' : 'Microsoft'}
            </button>
          </div>

          {oauthErr && (
            <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(220, 38, 38, 0.06)', border: '1px solid rgba(220, 38, 38, 0.25)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12, color: 'var(--bad)', lineHeight: 1.5 }}>
              <Icon name="x" size={13} style={{ flexShrink: 0, marginTop: 2 }}/>
              <div style={{ flex: 1, minWidth: 0 }}>{oauthErr}</div>
              <button type="button" onClick={() => setOauthErr(null)} className="btn-ghost" style={{ padding: 2, color: 'var(--bad)' }} aria-label="Cerrar">
                <Icon name="x" size={11}/>
              </button>
            </div>
          )}

          <div style={{ marginTop: 14, padding: 12, background: 'var(--paper-up)', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', display: 'flex', gap: 10, fontSize: 11, color: 'var(--ink-mute)', lineHeight: 1.5 }}>
            <Icon name="shieldCk" size={14} style={{ color: 'var(--good)', flexShrink: 0, marginTop: 1 }}/>
            <div>
              Sesión cifrada extremo a extremo (AES-256) y protegida por <span className="mono" style={{ color: 'var(--ink)' }}>turnstile</span>.
              Cumplimos HIPAA · ISO 27001 · SOC 2.
            </div>
          </div>
        </form>

        <div className="serial" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
          <span>© 2026 Digital Pharma Solutions</span>
          <span>↳ status.dpsdesk.cl</span>
        </div>
      </div>
    </div>
  );
}

window.LoginScreen = LoginScreen;
