/* global React */
const { useState } = React;

function ConfigScreen({ profile, onProfileChange }) {
  const [section, setSection] = useState('network');
  const sections = [
    { id: 'network', num: '01', label: 'Red',            desc: 'Servidor · relay' },
    { id: 'alerts',  num: '02', label: 'Notificaciones', desc: 'Email · webhooks' },
    { id: 'team',    num: '03', label: 'Equipo',         desc: '4 miembros' },
  ];

  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', borderTop: '1px solid var(--line)', minHeight: 'calc(100vh - 140px)' }}>
      <aside style={{ borderRight: '1px solid var(--line)', padding: '32px 0', background: 'var(--paper-up)' }}>
        {sections.map(s => {
          const active = s.id === section;
          return (
            <button key={s.id} onClick={() => setSection(s.id)}
              style={{
                width: '100%', textAlign: 'left',
                padding: '16px 26px',
                borderTop: '1px solid var(--line)',
                background: active ? 'var(--paper-2)' : 'transparent',
                borderLeft: active ? '2px solid var(--plum)' : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: active ? 600 : 500 }}>{s.label}</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 4 }}>{s.desc}</div>
              </div>
              {active && <span style={{ color: 'var(--plum)' }}>●</span>}
            </button>
          );
        })}
      </aside>

      <div style={{ padding: '40px 56px 80px', maxWidth: 1100 }}>
        {section === 'network' && <NetworkConfig/>}
        {section === 'alerts'  && <AlertsSection/>}
        {section === 'team'    && <TeamSection profile={profile} onProfileChange={onProfileChange}/>}
      </div>
    </div>
  );
}

function CfgRow({ title, desc, children, last }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, padding: '20px 0', borderBottom: last ? 'none' : '1px solid var(--line)' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{title}</div>
        {desc && <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 4, lineHeight: 1.5 }}>{desc}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>{children}</div>
    </div>
  );
}

function SectionHead({ num, title, italic, kicker }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 className="display" style={{ fontSize: 56, margin: 0, lineHeight: 0.95 }}>{title} <span className="italic-d">{italic}</span></h2>
      {kicker && <div style={{ fontSize: 15, color: 'var(--ink-mute)', marginTop: 14, maxWidth: 640, lineHeight: 1.5 }}>{kicker}</div>}
    </div>
  );
}

function GeneralSection() {
  const [t1, setT1] = useState(true);
  const [t2, setT2] = useState(false);
  return (
    <>
      <SectionHead num="01" title="Identidad" italic="del sistema" kicker="Información que aparece en la interfaz, los reportes exportados y los correos automáticos enviados a los técnicos."/>
      <CfgRow title="Nombre de la organización" desc="Visible en facturación, dispositivos y notificaciones.">
        <input className="input mono" defaultValue="Digital Pharma — Operations" style={{ fontSize: 12 }}/>
      </CfgRow>
      <CfgRow title="Zona horaria" desc="Determina las marcas de tiempo en logs y reportes.">
        <select className="input mono" style={{ fontSize: 12 }} defaultValue="cl">
          <option value="cl">America/Santiago (UTC−4)</option>
          <option value="ar">America/Buenos Aires (UTC−3)</option>
          <option value="mx">America/Mexico_City (UTC−6)</option>
        </select>
      </CfgRow>
      <CfgRow title="Idioma de la interfaz" desc="Aplica al panel administrativo. Los técnicos lo eligen aparte.">
        <div className="seg">
          <button data-active="true">Español</button>
          <button data-active="false">English</button>
          <button data-active="false">Português</button>
        </div>
      </CfgRow>
      <CfgRow title="Modo desarrollador" desc="Habilita herramientas de diagnóstico avanzadas, payloads crudos en logs y endpoint /debug.">
        <div className="toggle" data-on={t1} onClick={() => setT1(!t1)}/>
      </CfgRow>
      <CfgRow title="Telemetría anónima" desc="Comparte uso agregado con Digital Pharma para mejorar el producto." last>
        <div className="toggle" data-on={t2} onClick={() => setT2(!t2)}/>
      </CfgRow>
    </>
  );
}

function SecuritySection() {
  const [mfa, setMfa] = useState(true);
  const [sso, setSso] = useState(true);
  const [ip, setIp] = useState(false);
  return (
    <>
      <SectionHead num="02" title="Seguridad" italic="y acceso" kicker="Políticas que se aplican a todo el equipo. Los cambios afectan la próxima sesión."/>

      <div style={{ background: 'var(--plum)', color: '#FFFFFF', padding: 22, borderRadius: 'var(--r)', marginBottom: 30, display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ width: 40, height: 40, borderRadius: 'var(--r-sm)', background: 'rgba(255,255,255,0.15)', color: 'var(--lime)', display: 'grid', placeItems: 'center' }}>
          <Icon name="shieldCk" size={18}/>
        </div>
        <div style={{ flex: 1 }}>
          <div className="display" style={{ fontSize: 22, lineHeight: 1.1 }}>Postura de seguridad: <span className="italic-d" style={{ color: 'var(--lime)' }}>fuerte</span></div>
          <div className="mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>4/5 controles activos · última auditoría 18.04.26</div>
        </div>
        <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.25)', color: '#FFFFFF' }}>Ver reporte ↗</button>
      </div>

      <CfgRow title="Autenticación de dos factores" desc="Obligatorio para todos los administradores y técnicos al iniciar sesión.">
        <div className="toggle" data-on={mfa} onClick={() => setMfa(!mfa)}/>
      </CfgRow>
      <CfgRow title="SSO con Google Workspace" desc="Conectado al dominio digitalpharma.cl. Los nuevos usuarios se aprovisionan al primer login.">
        <div className="toggle" data-on={sso} onClick={() => setSso(!sso)}/>
      </CfgRow>
      <CfgRow title="Lista blanca de IPs" desc="Restringe el acceso al panel a un rango definido (CIDR). Útil para conexiones desde oficina.">
        <div className="toggle" data-on={ip} onClick={() => setIp(!ip)}/>
      </CfgRow>
      <CfgRow title="Tiempo de inactividad" desc="Cierra automáticamente la sesión si no hay actividad.">
        <select className="input mono" style={{ fontSize: 12 }} defaultValue="30">
          <option value="15">15 minutos</option>
          <option value="30">30 minutos</option>
          <option value="60">1 hora</option>
          <option value="0">Nunca</option>
        </select>
      </CfgRow>
      <CfgRow title="Sesiones activas" desc="Cierra todas las sesiones excepto la actual." last>
        <button className="btn btn-sm">Cerrar 3 sesiones</button>
      </CfgRow>
    </>
  );
}

function NetworkConfig() {
  const initialEndpoint = (window.API && window.API.getBaseURL && window.API.getBaseURL()) || 'https://backend-production-a5b7d.up.railway.app';
  const [cfg, setCfg] = useState({
    endpoint: initialEndpoint,
    secret: '••••••••••••••••',
    port: '443',
    heartbeat: '5000',
    retries: '3',
  });
  const [savedSnap, setSavedSnap] = useState(cfg);
  const [showSecret, setShowSecret] = useState(false);
  const [lastModified, setLastModified] = useState('—');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveFlash, setSaveFlash] = useState(null);

  const dirty = JSON.stringify(cfg) !== JSON.stringify(savedSnap);
  const update = (k, v) => setCfg(c => ({ ...c, [k]: v }));

  // Test real: hace un fetch al endpoint configurado y mide latencia.
  const runTest = async () => {
    if (testing) return;
    setTestResult(null);
    setTesting(true);
    const t0 = performance.now();
    try {
      const res = await fetch(cfg.endpoint.replace(/\/$/, '') + '/api/auth/me', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + (window.API?.getToken?.() || '') },
      });
      const ms = Math.round(performance.now() - t0);
      // 401 también cuenta como "alcanzable" — endpoint vivo, sólo no autorizado.
      const ok = res.status < 500;
      setTestResult({
        ok,
        ms,
        msg: ok
          ? `Conexión establecida con ${cfg.endpoint} en ${ms} ms · HTTP ${res.status}.`
          : `Servidor respondió HTTP ${res.status} — el endpoint puede estar caído.`,
      });
    } catch (err) {
      const ms = Math.round(performance.now() - t0);
      setTestResult({ ok: false, ms, msg: `No se pudo conectar (${ms} ms): ${err.message}` });
    } finally {
      setTesting(false);
    }
  };

  const save = () => {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      if (window.API && window.API.setBaseURL) {
        window.API.setBaseURL(cfg.endpoint.replace(/\/$/, ''));
      }
      setSavedSnap(cfg);
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      setLastModified(`${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${String(now.getFullYear()).slice(2)} · ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`);
      setSaveFlash('Configuración guardada · próxima petición usa el nuevo endpoint.');
      setTimeout(() => setSaveFlash(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SectionHead num="03" title="Red" italic="& relay" kicker="Servidores que coordinan las conexiones entre el panel y los POS. Cambios reinician túneles activos."/>

      {/* Card 1 — Infraestructura */}
      <div className="cfg-card" style={{ marginBottom: 22 }}>
        <div className="cfg-card-head">
          <div className="cfg-card-head-left">
            <div className="cfg-card-icon"><Icon name="globe" size={14}/></div>
            <div className="cfg-card-title">Infraestructura de Red</div>
          </div>
          <span className="pill-status pill-ok">
            <span className="dot ok"/> API sincronizada
          </span>
        </div>
        <div className="cfg-card-body">
          <div className="cfg-grid-2">
            <div className="cfg-field">
              <label className="cfg-field-label">Endpoint de puerta de enlace</label>
              <input className="cfg-input mono" value={cfg.endpoint} onChange={e => update('endpoint', e.target.value)}/>
            </div>
            <div className="cfg-field">
              <label className="cfg-field-label">Protocolo de acceso seguro</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showSecret ? 'text' : 'password'}
                  className="cfg-input mono"
                  value={cfg.secret}
                  onChange={e => update('secret', e.target.value)}
                />
                <button
                  className="cfg-input-action"
                  type="button"
                  aria-label={showSecret ? 'Ocultar' : 'Mostrar'}
                  onClick={() => setShowSecret(s => !s)}
                ><Icon name={showSecret ? 'eyeOff' : 'eye'} size={13}/></button>
              </div>
            </div>
          </div>
          <div className="cfg-grid-3">
            <div className="cfg-field">
              <label className="cfg-field-label">Puerto de control</label>
              <input className="cfg-input mono" value={cfg.port} onChange={e => update('port', e.target.value)}/>
            </div>
            <div className="cfg-field">
              <label className="cfg-field-label">Frecuencia de latido (ms)</label>
              <input className="cfg-input mono" value={cfg.heartbeat} onChange={e => update('heartbeat', e.target.value)}/>
            </div>
            <div className="cfg-field">
              <label className="cfg-field-label">Máximo de reintentos</label>
              <input className="cfg-input mono" value={cfg.retries} onChange={e => update('retries', e.target.value)}/>
            </div>
          </div>

          {/* Test result banner */}
          {testResult && (
            <div className={'cfg-banner ' + (testResult.ok ? 'ok' : 'bad')}>
              <Icon name={testResult.ok ? 'check' : 'x'} size={14}/>
              <span>{testResult.msg}</span>
              <button className="cfg-banner-close" onClick={() => setTestResult(null)} aria-label="Cerrar">
                <Icon name="x" size={11}/>
              </button>
            </div>
          )}
          {saveFlash && (
            <div className="cfg-banner ok">
              <Icon name="check" size={14}/>
              <span>{saveFlash}</span>
            </div>
          )}

          <div className="cfg-card-foot">
            <span className="mono italic-d" style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
              Última modificación: {lastModified}{dirty && <span style={{ color: 'var(--bad)', marginLeft: 8 }}>· cambios sin guardar</span>}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-sm" onClick={runTest} disabled={testing}>
                {testing ? <><span className="spinner"/> Probando…</> : <>Probar conexión</>}
              </button>
              <button
                className="btn btn-acid btn-sm"
                style={{ background: dirty ? 'var(--plum)' : 'var(--ink-soft)', borderColor: dirty ? 'var(--plum-2)' : 'var(--ink-soft)', color: '#FFF', opacity: dirty ? 1 : 0.5, cursor: dirty ? 'pointer' : 'not-allowed' }}
                onClick={save}
                disabled={!dirty || saving}
              >
                {saving ? <><span className="spinner"/> Guardando…</> : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2 — Políticas de relay */}
      <div className="cfg-card">
        <div className="cfg-card-head">
          <div className="cfg-card-head-left">
            <div className="cfg-card-icon"><Icon name="shieldCk" size={14}/></div>
            <div className="cfg-card-title">Políticas de relay</div>
          </div>
        </div>
        <div className="cfg-card-body" style={{ padding: 0 }}>
          <PolicyRow icon="lock"     title="Cifrado de sesión (AES-256)"   desc="Obligatorio para todos los apretones de manos del terminal." defaultOn/>
          <PolicyRow icon="users"   title="Ritual de multifactor"          desc="Requerir 2FA para todas las acciones de alto privilegio." defaultOn/>
          <PolicyRow icon="terminal" title="Registro de auditoría automatizado" desc="Persistir registros de rituales durante 90 días." defaultOn/>
          <PolicyRow icon="bell"     title="Notificaciones de incidentes"   desc="Alertas en tiempo real para infracciones de protocolo." defaultOn last/>
        </div>
      </div>
    </>
  );
}

function PolicyRow({ icon, title, desc, defaultOn = false, last = false }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="policy-row" style={{ borderBottom: last ? 'none' : '1px solid var(--line)' }}>
      <div className="policy-row-icon"><Icon name={icon} size={14}/></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="policy-row-title">{title}</div>
        <div className="policy-row-desc">{desc}</div>
      </div>
      <div className="toggle" data-on={on} onClick={() => setOn(!on)}/>
    </div>
  );
}

function AlertsSection() {
  const [a1, setA1] = useState(true);
  const [a2, setA2] = useState(true);
  const [a3, setA3] = useState(false);
  const [a4, setA4] = useState(true);
  return (
    <>
      <SectionHead num="04" title="Avísame" italic="cuando…" kicker="Las reglas se evalúan cada 30 segundos contra los heartbeats de la red."/>
      <CfgRow title="POS sin conexión > 10 min" desc="Email + push a guardia de turno.">
        <div className="toggle" data-on={a1} onClick={() => setA1(!a1)}/>
      </CfgRow>
      <CfgRow title="Caída completa de un local" desc="Todos los POS de una sucursal pierden señal simultáneamente.">
        <div className="toggle" data-on={a2} onClick={() => setA2(!a2)}/>
      </CfgRow>
      <CfgRow title="Latencia > 200 ms (5 min sostenidos)" desc="Indicador de problema de ISP en una sucursal.">
        <div className="toggle" data-on={a3} onClick={() => setA3(!a3)}/>
      </CfgRow>
      <CfgRow title="Login desde IP nueva" desc="Detecta acceso al panel desde una ubicación no vista antes.">
        <div className="toggle" data-on={a4} onClick={() => setA4(!a4)}/>
      </CfgRow>
      <CfgRow title="Webhooks" desc="POST JSON a un endpoint personalizado por cada evento." last>
        <button className="btn btn-sm">Configurar 2 webhooks</button>
      </CfgRow>
    </>
  );
}

function TeamSection({ profile, onProfileChange }) {
  const me = profile || { name: 'Sebastián Gómez', email: 'admin@digitalpharma.cl' };
  const initial = [
    { id: 'u1', n: me.name, e: me.email, r: 'Admin',   last: 'ahora', isMe: true },
    { id: 'u2', n: 'Carla Martínez',   e: 'carla@digitalpharma.cl',      r: 'Técnica', last: 'hace 12 min' },
    { id: 'u3', n: 'Diego Ramírez',    e: 'diego@digitalpharma.cl',      r: 'Técnica', last: 'hace 2 h' },
    { id: 'u4', n: 'Pamela Rojas',     e: 'pamela@digitalpharma.cl',     r: 'Técnica', last: 'hace 4 días' },
  ];
  const [members, setMembers] = useState(initial);
  const [menuOpen, setMenuOpen] = useState(null);
  const [editing, setEditing] = useState(null);
  const [inviting, setInviting] = useState(false);

  // Keep "me" row in sync with global profile (in case it's edited from header → Mi perfil)
  React.useEffect(() => {
    setMembers(ms => ms.map(m => m.isMe ? { ...m, n: me.name, e: me.email } : m));
  }, [me.name, me.email]);

  const remove = (id) => {
    setMembers(ms => ms.filter(m => m.id !== id));
    setMenuOpen(null);
  };
  const save = (next) => {
    setMembers(ms => ms.map(m => m.id === next.id ? { ...m, ...next } : m));
    // If editing the current user, propagate up to global profile
    if (next.isMe && onProfileChange) {
      onProfileChange(p => ({ ...(p || {}), name: next.n, email: next.e }));
    }
    setEditing(null);
  };

  return (
    <>
      <SectionHead num="03" title="Tu" italic="equipo" kicker={`${members.length} personas pueden acceder al panel. Los roles se aplican globalmente — los permisos por empresa se gestionan en cada empresa.`}/>
      <div className="card" style={{ overflow: 'visible' }}>
        <div className="row" style={{ gridTemplateColumns: '2fr 1fr 130px 40px', background: 'var(--paper-2)', height: 48, padding: '0 24px' }}>
          <span className="serial" style={{ fontSize: 11 }}>Persona</span>
          <span className="serial" style={{ fontSize: 11 }}>Rol</span>
          <span className="serial" style={{ fontSize: 11 }}>Última actividad</span>
          <span/>
        </div>
        {members.map(m => (
          <div key={m.id} className="row" style={{ gridTemplateColumns: '2fr 1fr 130px 40px', position: 'relative', height: 64, padding: '0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span className="avatar" style={{ width: 36, height: 36, fontSize: 12 }}>{m.n.split(' ').map(s=>s[0]).join('').slice(0,2)}</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{m.n}</div>
                <div className="mono" style={{ fontSize: 12, color: 'var(--ink)', marginTop: 3, fontWeight: 500 }}>{m.e}</div>
              </div>
            </div>
            <span className={`chip ${m.r === 'Admin' ? 'ink' : 'plum'}`} style={{ width: 'fit-content', fontSize: 12, padding: '6px 12px' }}>{m.r}</span>
            <span className="mono" style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{m.last}</span>
            <div style={{ position: 'relative' }}>
              <button
                className="btn-ghost"
                style={{ padding: 8 }}
                onClick={() => setMenuOpen(menuOpen === m.id ? null : m.id)}
                aria-label="Acciones"
              >
                <Icon name="dots" size={16}/>
              </button>
              {menuOpen === m.id && (
                <>
                  <div onClick={() => setMenuOpen(null)} style={{ position: 'fixed', inset: 0, zIndex: 30 }}/>
                  <div className="ctx-menu">
                    <button className="ctx-item" onClick={() => { setEditing(m); setMenuOpen(null); }}>
                      <Icon name="edit" size={12}/>
                      <span>Editar miembro</span>
                    </button>
                    <button className="ctx-item ctx-item-danger" onClick={() => remove(m.id)}>
                      <Icon name="trash" size={12}/>
                      <span>Eliminar</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
        <button onClick={() => setInviting(true)} className="btn" style={{ background: 'var(--plum)', borderColor: 'var(--plum-2)', color: '#FFF', height: 44, padding: '0 20px', fontSize: 14 }}><Icon name="plus" size={14}/> Invitar a alguien</button>
        <button className="btn" style={{ height: 44, padding: '0 20px', fontSize: 14 }}>Ver permisos</button>
      </div>

      {editing && <EditMemberModal member={editing} onSave={save} onClose={() => setEditing(null)}/>}
      {inviting && <InviteMemberModal onClose={() => setInviting(false)} onInvite={(m) => {
        setMembers(ms => [...ms, { id: 'u' + Date.now(), n: m.email.split('@')[0], e: m.email, r: m.role, last: 'pendiente' }]);
        setInviting(false);
      }}/>}
    </>
  );
}

function EditMemberModal({ member, onSave, onClose }) {
  const [name, setName] = useState(member.n);
  const [email, setEmail] = useState(member.e);
  const [role, setRole] = useState(member.r);
  const roles = ['Admin', 'Técnica'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-shell modal-compact" onClick={e => e.stopPropagation()}>
        <div className="modal-head-compact">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontFamily: 'var(--sans)', fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--ink)' }}>
              Editar miembro
            </h3>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', marginTop: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {member.n}
            </div>
          </div>
          <button onClick={onClose} className="btn-icon-close" aria-label="Cerrar">
            <Icon name="x" size={14}/>
          </button>
        </div>
        <form className="modal-body-compact" onSubmit={e => { e.preventDefault(); onSave({ id: member.id, n: name, e: email, r: role }); }}>
          <div className="form-row-compact">
            <label className="form-label-compact">Nombre <span style={{ color: 'var(--bad)', marginLeft: 4 }}>*</span></label>
            <input autoFocus className="input-compact" value={name} onChange={e => setName(e.target.value)} required/>
          </div>
          <div className="form-row-compact">
            <label className="form-label-compact">Email <span style={{ color: 'var(--bad)', marginLeft: 4 }}>*</span></label>
            <input className="input-compact mono" type="email" value={email} onChange={e => setEmail(e.target.value)} required/>
          </div>
          <div className="form-row-compact">
            <label className="form-label-compact">Rol</label>
            <div className="role-grid">
              {roles.map(r => (
                <button key={r} type="button" onClick={() => setRole(r)} className={'role-chip' + (role === r ? ' is-active' : '')}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="modal-foot-compact">
            <button type="button" onClick={onClose} className="btn-cancel-compact">Cancelar</button>
            <button type="submit" className="btn-save-compact">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InviteMemberModal({ onClose, onInvite }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Técnica');
  const [copied, setCopied] = useState(false);
  const roles = ['Admin', 'Técnica'];
  const inviteLink = `${window.location.origin}${window.location.pathname.replace(/[^/]+$/, '')}invite?token=DPS-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = inviteLink; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove();
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-shell modal-compact" onClick={e => e.stopPropagation()}>
        <div className="modal-head-compact">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontFamily: 'var(--sans)', fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--ink)' }}>
              Invitar a alguien
            </h3>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', marginTop: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Asigna rol y envía el enlace
            </div>
          </div>
          <button onClick={onClose} className="btn-icon-close" aria-label="Cerrar">
            <Icon name="x" size={14}/>
          </button>
        </div>
        <form className="modal-body-compact" onSubmit={e => { e.preventDefault(); if (email) onInvite({ email, role }); }}>
          <div className="form-row-compact">
            <label className="form-label-compact">Email <span style={{ color: 'var(--bad)', marginLeft: 4 }}>*</span></label>
            <input autoFocus className="input-compact mono" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="persona@digitalpharma.cl" required/>
          </div>
          <div className="form-row-compact">
            <label className="form-label-compact">Rol</label>
            <div className="role-grid">
              {roles.map(r => (
                <button key={r} type="button" onClick={() => setRole(r)} className={'role-chip' + (role === r ? ' is-active' : '')}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row-compact">
            <label className="form-label-compact">Enlace de invitación</label>
            <div className="invite-link-row">
              <input readOnly className="input-compact mono" value={inviteLink} style={{ flex: 1, fontSize: 11 }} onFocus={e => e.target.select()}/>
              <button type="button" onClick={copy} className={'btn-copy' + (copied ? ' is-copied' : '')}>
                <Icon name={copied ? 'check' : 'plus'} size={12}/>
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', marginTop: 6, letterSpacing: '0.04em' }}>
              Válido 7 días · entrega rol <strong style={{ color: 'var(--ink)' }}>{role}</strong>
            </div>
          </div>

          <div className="modal-foot-compact">
            <button type="button" onClick={onClose} className="btn-cancel-compact">Cancelar</button>
            <button type="submit" className="btn-save-compact" disabled={!email}>Enviar invitación</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BillingSection() {
  return (
    <>
      <SectionHead num="06" title="Facturación" italic="& uso" kicker="Los cargos se calculan por POS activo conectado al menos una vez en el mes."/>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="serial">Plan actual</div>
          <div className="display" style={{ fontSize: 32, marginTop: 8 }}>Empresarial</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 6 }}>Hasta 100 POS · soporte 24/7 · auditoría</div>
          <button className="btn btn-sm" style={{ marginTop: 16 }}>Cambiar plan</button>
        </div>
        <div className="card" style={{ padding: 20, background: 'var(--ink)', color: 'var(--paper)', border: 'none' }}>
          <div className="serial" style={{ color: 'var(--lime)' }}>Próximo cargo</div>
          <div className="display num" style={{ fontSize: 32, marginTop: 8 }}>$ 489.000</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 6 }}>01.05.26 · CLP · Visa ••• 4421</div>
          <button className="btn btn-acid btn-sm" style={{ marginTop: 16 }}>Ver factura</button>
        </div>
      </div>
      <CfgRow title="Uso del mes" desc="63 POS conectados de 100 incluidos en el plan.">
        <div style={{ width: '100%' }}>
          <div className="num mono" style={{ fontSize: 12, marginBottom: 6, textAlign: 'right' }}>63 / 100</div>
          <div style={{ height: 4, background: 'var(--paper-3)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: '63%', height: '100%', background: 'var(--lime)' }}/>
          </div>
        </div>
      </CfgRow>
      <CfgRow title="Método de pago" last>
        <button className="btn btn-sm"><Icon name="card" size={12}/> Visa terminada en 4421</button>
      </CfgRow>
    </>
  );
}

function LogsSection() {
  const logs = [
    { t: '14:28:03', a: 'security.mfa.enabled', u: 'sebastian@dp', tone: 'good' },
    { t: '13:54:11', a: 'team.member.invited',  u: 'sebastian@dp', tone: 'plum' },
    { t: '12:08:41', a: 'session.connect',       u: 'carla@dp',     tone: 'plum' },
    { t: '11:22:09', a: 'config.relay.updated', u: 'sebastian@dp', tone: 'warn' },
    { t: '09:07:32', a: 'auth.login.success',   u: 'diego@dp',      tone: 'plum' },
    { t: 'ayer 18:44', a: 'webhook.delivery.failed', u: 'system', tone: 'bad' },
  ];
  return (
    <>
      <SectionHead num="07" title="Auditoría" italic="completa" kicker="Cada acción del panel queda registrada y se conserva 12 meses. Exportable en CSV o vía API."/>
      <div className="card" style={{ overflow: 'hidden', fontFamily: 'var(--mono)' }}>
        {logs.map((l, i) => (
          <div key={i} className="row" style={{ gridTemplateColumns: '90px 1fr 160px 24px', height: 38, fontSize: 11 }}>
            <span style={{ color: 'var(--ink-soft)' }}>{l.t}</span>
            <span style={{ color: l.tone === 'bad' ? 'var(--bad)' : l.tone === 'warn' ? 'var(--warn)' : 'var(--ink)' }}>{l.a}</span>
            <span style={{ color: 'var(--ink-mute)' }}>{l.u}</span>
            <span className={`dot ${l.tone === 'plum' ? 'ok' : l.tone}`} style={{ color: l.tone === 'plum' ? 'var(--plum)' : `var(--${l.tone})` }}/>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button className="btn btn-sm"><Icon name="download" size={12}/> Exportar CSV</button>
        <button className="btn btn-sm">Ver todos los registros</button>
      </div>
    </>
  );
}

window.ConfigScreen = ConfigScreen;
