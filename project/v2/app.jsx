/* global React, ReactDOM */
const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "lime",
  "density": "comfortable",
  "dark": false
}/*EDITMODE-END*/;

const ACCENTS = {
  lime:    { lime: '#C5F23E', lime2: '#B3DD37', limeInk: '#2D3A06' },
  electric:{ lime: '#A4F0FF', lime2: '#83DDF0', limeInk: '#053744' },
  coral:   { lime: '#FF9D6E', lime2: '#F2865A', limeInk: '#3A1402' },
  yellow:  { lime: '#FFD93D', lime2: '#F2C82A', limeInk: '#3D2D02' },
};

function App() {
  const [tweaks, setTweaks] = useTweaks(TWEAK_DEFAULTS);
  const [authed, setAuthed] = useState(false);
  const [route, setRoute] = useState('dashboard');
  const [activeSession, setActiveSession] = useState(null); // { device, tool }
  const [tunnelDevice, setTunnelDevice] = useState(null);
  const [rdpDevice, setRdpDevice] = useState(null);
  const [networkInitialCompany, setNetworkInitialCompany] = useState(null);
  const [deviceOverrides, setDeviceOverrides] = useState({}); // { [deviceId]: { deleted?, name? } }
  const updateDevice = (id, patch) => setDeviceOverrides(prev => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }));
  const [recentOpen, setRecentOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Sebastián Gómez',
    email: 'admin@digitalpharma.cl',
    phone: '+56 9 4123 5678',
    lang: 'Español (Chile)',
    tz: 'America/Santiago',
  });
  const initials = profile.name.split(/\s+/).map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '·';
  const userObj = { name: profile.name, email: profile.email, initials };

  // Apply tweaks to root
  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('dark', !!tweaks.dark);
    html.classList.remove('density-compact', 'density-spacious');
    if (tweaks.density === 'compact') html.classList.add('density-compact');
    if (tweaks.density === 'spacious') html.classList.add('density-spacious');
    const a = ACCENTS[tweaks.accent] || ACCENTS.lime;
    html.style.setProperty('--lime', a.lime);
    html.style.setProperty('--lime-2', a.lime2);
    html.style.setProperty('--lime-ink', a.limeInk);
  }, [tweaks]);

  const toggleDark = () => setTweaks('dark', !tweaks.dark);

  if (!authed) {
    return (
      <>
        <LoginScreen
          onLogin={(oauth) => {
            if (oauth && oauth.email) {
              setProfile(p => ({
                ...p,
                name: oauth.name || p.name,
                email: oauth.email,
                picture: oauth.picture || p.picture,
                provider: oauth.provider,
              }));
            }
            setAuthed(true);
          }}
          dark={tweaks.dark}
          onToggleDark={toggleDark}
        />
        <DesignTweaks tweaks={tweaks} setTweak={setTweaks}/>
      </>
    );
  }

  const meta = {
    dashboard: { num: '01', section: 'DASHBOARD',     title: <>Centro de <span className="italic-d">control</span></>, kicker: 'Una vista en vivo de la red de POS — refresco cada 30 s.' },
    network:   { num: '02', section: 'EMPRESAS',      title: <>Red de <span className="italic-d">empresas</span></>,    kicker: 'Tres niveles: empresa → local → dispositivo. Filtros y búsqueda activos.' },
    config:    { num: '',   section: '',              title: <>Ajustes del <span className="italic-d">sistema</span></>, kicker: 'Identidad, seguridad, equipo y facturación.' },
  }[route];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--paper)' }}>
      <Sidebar active={route} onNavigate={setRoute} onLogout={() => setAuthed(false)} onOpenRecent={() => setRecentOpen(true)}/>
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <TopNav
          section={meta.section}
          num={meta.num}
          title={meta.title}
          kicker={meta.kicker}
          dark={tweaks.dark}
          onToggleDark={toggleDark}
          actions={null}
          user={userObj}
          onProfile={() => setProfileOpen(true)}
          onPreferences={() => setRoute('config')}
          onSecurity={() => setRoute('config')}
          onHelp={() => setHelpOpen(true)}
          onLogout={() => setAuthed(false)}
        />
        {route === 'dashboard' && <DashboardScreen
          onNavigate={setRoute}
          onConnect={(d) => setActiveSession({ device: d, tool: 'screen' })}
          onOpenCompany={(companyId) => { setNetworkInitialCompany(companyId); setRoute('network'); }}
        />}
        {route === 'network'   && <NetworkScreen
          initialCompany={networkInitialCompany}
          deviceOverrides={deviceOverrides}
          onUpdateDevice={updateDevice}
          onConnect={(d) => setActiveSession({ device: d, tool: 'screen' })}
          onConnectTool={(d, tool, opts = {}) => setActiveSession({ device: d, tool, admin: !!opts.admin })}
          onTunnel={(d) => setTunnelDevice(d)}
          onRdp={(d) => setRdpDevice(d)}
        />}
        {route === 'config'    && <ConfigScreen profile={profile} onProfileChange={setProfile}/>}
      </main>
      <DesignTweaks tweaks={tweaks} setTweak={setTweaks}/>
      {activeSession && <RemoteSession device={activeSession.device} initialTool={activeSession.tool} initialAdmin={!!activeSession.admin} onClose={() => setActiveSession(null)}/>}
      {tunnelDevice && <TcpTunnelModal device={tunnelDevice} onClose={() => setTunnelDevice(null)}/>}
      {rdpDevice && <RdpModal device={rdpDevice} onClose={() => setRdpDevice(null)}/>}
      {recentOpen && <RecentSessionsModal onClose={() => setRecentOpen(false)} onOpen={(d) => { setRecentOpen(false); setActiveSession({ device: d, tool: 'screen' }); }}/>}
      {profileOpen && <ProfileModal profile={profile} initials={initials} onChange={setProfile} onClose={() => setProfileOpen(false)}/>}
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)}/>}
    </div>
  );
}

function RecentSessionsModal({ onClose, onOpen }) {
  // Pull real devices from data.js (DEVICES global) + locale info from LOCALES
  const localByCod = {};
  (typeof LOCALES !== 'undefined' ? LOCALES : []).forEach(l => { localByCod[l.company + '|' + l.cod] = l; });

  const sessions = [
    { devId: '1',  when: 'hace 12 min' },
    { devId: '10', when: 'hace 1 h'    },
    { devId: '12', when: 'hace 3 h'    },
    { devId: '13', when: 'ayer'        },
    { devId: '4',  when: 'hace 2 días' },
  ].map(s => {
    const d = (typeof DEVICES !== 'undefined' ? DEVICES : []).find(x => x.id === s.devId);
    if (!d) return null;
    const loc = localByCod[d.company + '|' + d.localCod];
    return { device: d, local: loc, when: s.when };
  }).filter(Boolean);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-shell modal-compact" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-head-compact">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontFamily: 'var(--sans)', fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--ink)' }}>
              Sesiones recientes
            </h3>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', marginTop: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Últimas {sessions.length} conexiones
            </div>
          </div>
          <button onClick={onClose} className="btn-icon-close" aria-label="Cerrar">
            <Icon name="x" size={14}/>
          </button>
        </div>
        <div style={{ padding: '8px 0' }}>
          {sessions.map(({ device, local, when }) => (
            <button key={device.id} onClick={() => onOpen(device)}
              disabled={device.status === 'offline'}
              className="recent-row"
              style={device.status === 'offline' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>
              <span className={'dot ' + (device.status === 'online' ? 'ok' : 'bad')}/>
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{device.name} · {device.company}</div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', marginTop: 2 }}>{local ? local.name : '—'}</div>
              </div>
              <span className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)' }}>{when}</span>
              <Icon name="chevronR" size={12}/>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileModal({ profile: initial, initials, onChange, onClose }) {
  const [mode, setMode] = useState('view');
  const profile = initial;
  const [draft, setDraft] = useState(profile);
  const [pwdState, setPwdState] = useState({ cur: '', nu: '', cf: '' });
  const [savedFlash, setSavedFlash] = useState(null);

  const startEdit = () => { setDraft(profile); setMode('edit'); };
  const saveEdit = () => {
    onChange(draft);
    setMode('view');
    setSavedFlash('Perfil actualizado.');
    setTimeout(() => setSavedFlash(null), 2400);
  };
  const cancelEdit = () => { setDraft(profile); setMode('view'); };

  const startPwd = () => { setPwdState({ cur: '', nu: '', cf: '' }); setMode('pwd'); };
  const pwdValid = pwdState.cur.length >= 1 && pwdState.nu.length >= 8 && pwdState.nu === pwdState.cf;
  const savePwd = () => {
    if (!pwdValid) return;
    setMode('view');
    setSavedFlash('Contraseña actualizada.');
    setTimeout(() => setSavedFlash(null), 2400);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-shell modal-compact" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div className="modal-head-compact">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontFamily: 'var(--sans)', fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--ink)' }}>
              {mode === 'pwd' ? 'Cambiar contraseña' : mode === 'edit' ? 'Editar perfil' : 'Mi perfil'}
            </h3>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', marginTop: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {mode === 'pwd' ? 'Mínimo 8 caracteres' : 'Cuenta · Sesión'}
            </div>
          </div>
          <button onClick={onClose} className="btn-icon-close" aria-label="Cerrar">
            <Icon name="x" size={14}/>
          </button>
        </div>

        {savedFlash && (
          <div style={{ margin: '14px 24px 0', padding: '10px 14px', background: 'var(--good-soft)', color: 'var(--good)', borderRadius: 'var(--r-sm)', fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="check" size={13}/> {savedFlash}
          </div>
        )}

        {/* === VIEW === */}
        {mode === 'view' && (
          <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, paddingBottom: 22, borderBottom: '1px solid var(--line)' }}>
              <div style={{
                width: 64, height: 64, borderRadius: 999,
                background: 'var(--plum)', color: '#FFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 600, letterSpacing: '0.04em',
              }}>{initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{profile.name}</div>
                <div className="mono" style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 4 }}>{profile.email}</div>
                <div style={{ marginTop: 8, display: 'inline-flex', gap: 6, alignItems: 'center', padding: '4px 10px', background: 'var(--plum-soft)', color: 'var(--plum)', borderRadius: 999, fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
                  Administrador
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: '20px 0' }}>
              {[
                ['Empresa', 'Digital Pharma Solutions'],
                ['Teléfono', profile.phone],
                ['Idioma', profile.lang],
                ['Zona horaria', profile.tz],
                ['Último acceso', 'Hoy · 09:42'],
                ['MFA', 'Activo · App'],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="mono" style={{ fontSize: 9, color: 'var(--ink-soft)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{k}</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, paddingTop: 18, borderTop: '1px solid var(--line)', flexWrap: 'wrap' }}>
              <button className="btn" onClick={startEdit}><Icon name="edit" size={12}/> Editar perfil</button>
              <button className="btn" onClick={startPwd}><Icon name="lock" size={12}/> Cambiar contraseña</button>
            </div>
          </div>
        )}

        {/* === EDIT === */}
        {mode === 'edit' && (
          <div style={{ padding: 24 }}>
            <div style={{ display: 'grid', gap: 16 }}>
              {[
                { k: 'name',  label: 'Nombre completo' },
                { k: 'email', label: 'Correo electrónico', type: 'email' },
                { k: 'phone', label: 'Teléfono' },
                { k: 'lang',  label: 'Idioma' },
                { k: 'tz',    label: 'Zona horaria' },
              ].map(f => (
                <label key={f.k}>
                  <div className="serial" style={{ marginBottom: 6 }}>{f.label}</div>
                  <input
                    className="input"
                    type={f.type || 'text'}
                    value={draft[f.k]}
                    onChange={e => setDraft(d => ({ ...d, [f.k]: e.target.value }))}
                    style={{ fontFamily: f.k === 'email' || f.k === 'phone' ? 'var(--mono)' : 'var(--sans)', fontSize: 13 }}
                  />
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--line)' }}>
              <button className="btn" onClick={cancelEdit}>Cancelar</button>
              <button className="btn btn-acid" style={{ marginLeft: 'auto' }} onClick={saveEdit}>
                <Icon name="check" size={12}/> Guardar cambios
              </button>
            </div>
          </div>
        )}

        {/* === PASSWORD === */}
        {mode === 'pwd' && (
          <div style={{ padding: 24 }}>
            <div style={{ display: 'grid', gap: 16 }}>
              <label>
                <div className="serial" style={{ marginBottom: 6 }}>Contraseña actual</div>
                <input className="input mono" type="password" value={pwdState.cur} onChange={e => setPwdState(s => ({ ...s, cur: e.target.value }))} style={{ fontSize: 13 }}/>
              </label>
              <label>
                <div className="serial" style={{ marginBottom: 6 }}>Nueva contraseña</div>
                <input className="input mono" type="password" value={pwdState.nu} onChange={e => setPwdState(s => ({ ...s, nu: e.target.value }))} style={{ fontSize: 13 }}/>
                <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', marginTop: 6, letterSpacing: '0.04em' }}>
                  Mínimo 8 caracteres · {pwdState.nu.length} actuales
                </div>
              </label>
              <label>
                <div className="serial" style={{ marginBottom: 6 }}>Confirmar nueva</div>
                <input className="input mono" type="password" value={pwdState.cf} onChange={e => setPwdState(s => ({ ...s, cf: e.target.value }))} style={{ fontSize: 13 }}/>
                {pwdState.cf.length > 0 && pwdState.cf !== pwdState.nu && (
                  <div className="mono" style={{ fontSize: 10, color: 'var(--bad)', marginTop: 6 }}>No coincide con la nueva contraseña.</div>
                )}
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--line)' }}>
              <button className="btn" onClick={() => setMode('view')}>Cancelar</button>
              <button className="btn btn-acid" style={{ marginLeft: 'auto' }} onClick={savePwd} disabled={!pwdValid}>
                <Icon name="check" size={12}/> Actualizar contraseña
              </button>
            </div>
          </div>
        )}
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

function DesignTweaks({ tweaks, setTweak }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection title="Apariencia">
        <TweakRadio label="Tema" value={tweaks.dark ? 'dark' : 'light'}
          options={[{value:'light',label:'Claro'},{value:'dark',label:'Oscuro'}]}
          onChange={v => setTweak('dark', v === 'dark')}/>
        <TweakSelect label="Acento" value={tweaks.accent}
          options={[
            {value:'lime',     label:'Lima eléctrico (default)'},
            {value:'electric', label:'Cian neón'},
            {value:'coral',    label:'Coral'},
            {value:'yellow',   label:'Amarillo señalético'},
          ]}
          onChange={v => setTweak('accent', v)}/>
        <TweakRadio label="Densidad" value={tweaks.density}
          options={[
            {value:'compact',     label:'Compacta'},
            {value:'comfortable', label:'Estándar'},
            {value:'spacious',    label:'Amplia'},
          ]}
          onChange={v => setTweak('density', v)}/>
      </TweakSection>
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
