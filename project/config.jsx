/* global React */
const { useState } = React;

function ConfigScreen() {
  const [section, setSection] = useState('infra');
  const [settings, setSettings] = useState({
    endpoint: 'relay.dpsdesk.cl',
    secret:   'sk_live_a3f9c2e1b4d8f7g6h5i4',
    port:     '21115',
    heartbeat: 30,
    retries:   5,
    aes:       true,
    mfa:       true,
    audit:     true,
    notify:    false,
    autoUpdate: true,
    sessionTimeout: 30,
    relayPolicy: 'auto',
  });
  const update = (k, v) => setSettings(s => ({ ...s, [k]: v }));
  const [tested, setTested] = useState(null);
  const [saving, setSaving] = useState(false);

  const sections = [
    { id: 'infra',    icon: 'server',    label: 'Infraestructura' },
    { id: 'security', icon: 'shield',    label: 'Seguridad' },
    { id: 'sessions', icon: 'terminal',  label: 'Sesiones' },
    { id: 'notify',   icon: 'bell',      label: 'Notificaciones' },
    { id: 'team',     icon: 'users',     label: 'Equipo' },
    { id: 'billing',  icon: 'sliders',   label: 'Facturación' },
    { id: 'about',    icon: 'info',      label: 'Acerca de' },
  ];

  return (
    <div className="fade-in" style={{ padding: '24px 28px 60px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Configuración</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--fg-muted)' }}>
          Administra la infraestructura, políticas de seguridad y preferencias del workspace.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 28, alignItems: 'flex-start' }}>
        {/* Side nav */}
        <nav style={{ position: 'sticky', top: 20 }}>
          {sections.map(s => (
            <button
              key={s.id}
              className="nav-item"
              data-active={section === s.id}
              onClick={() => setSection(s.id)}
              style={{ marginBottom: 2 }}
            >
              <Icon name={s.icon} size={14}/>
              <span>{s.label}</span>
            </button>
          ))}
          <div className="hr" style={{ margin: '14px 0' }}/>
          <div style={{ padding: '0 10px' }}>
            <div className="label-meta" style={{ fontSize: 10, marginBottom: 6 }}>Workspace</div>
            <div style={{ fontSize: 12, fontWeight: 500 }}>Digital Pharmacy Solutions</div>
            <div style={{ fontSize: 11, color: 'var(--fg-subtle)', marginTop: 2 }}>Plan Enterprise · 12 admins</div>
          </div>
        </nav>

        {/* Content */}
        <div>
          {section === 'infra' && (
            <Section
              title="Infraestructura de red"
              subtitle="Configura los endpoints del servidor RustDesk y políticas de relay."
            >
              <Field label="Endpoint del servidor" hint="Hostname del coordinador RustDesk (ID server).">
                <input className="input mono" value={settings.endpoint} onChange={e => update('endpoint', e.target.value)}/>
              </Field>
              <Field label="Secret key" hint="Se usará para autenticar a los clientes contra el servidor.">
                <input className="input mono" type="password" value={settings.secret} onChange={e => update('secret', e.target.value)}/>
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Puerto principal" hint="ID server / TCP">
                  <input className="input mono" value={settings.port} onChange={e => update('port', e.target.value)}/>
                </Field>
                <Field label="Política de relay">
                  <select className="input" value={settings.relayPolicy} onChange={e => update('relayPolicy', e.target.value)}>
                    <option value="auto">Automático (recomendado)</option>
                    <option value="always">Siempre vía relay</option>
                    <option value="never">Sólo conexión directa</option>
                  </select>
                </Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label={`Heartbeat (${settings.heartbeat}s)`} hint="Frecuencia con la que cada POS reporta estado.">
                  <input type="range" min="10" max="120" step="5" value={settings.heartbeat} onChange={e => update('heartbeat', +e.target.value)} style={{ width: '100%', accentColor: 'var(--accent-600)' }}/>
                </Field>
                <Field label={`Reintentos (${settings.retries})`} hint="Antes de marcar un POS como offline.">
                  <input type="range" min="1" max="20" value={settings.retries} onChange={e => update('retries', +e.target.value)} style={{ width: '100%', accentColor: 'var(--accent-600)' }}/>
                </Field>
              </div>
              <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
                <button
                  className="btn"
                  onClick={() => { setTested('testing'); setTimeout(() => setTested('ok'), 800); }}
                >
                  {tested === 'testing' ? <><span className="spinner"/> Probando…</> : <><Icon name="zap" size={13}/> Probar conexión</>}
                </button>
                {tested === 'ok' && <span className="chip ok"><Icon name="check" size={11}/> Conectado · 28 ms</span>}
                <div style={{ flex: 1 }}/>
                <button className="btn btn-ghost">Descartar</button>
                <button
                  className="btn btn-primary"
                  onClick={() => { setSaving(true); setTimeout(() => setSaving(false), 600); }}
                >
                  {saving ? <><span className="spinner" style={{ borderTopColor: '#fff' }}/> Guardando…</> : <>Guardar cambios</>}
                </button>
              </div>
            </Section>
          )}

          {section === 'security' && (
            <Section title="Políticas de seguridad" subtitle="Cifrado, acceso y auditoría de toda la red.">
              <SwitchRow
                title="Cifrado AES-256 extremo a extremo"
                desc="Todo el tráfico entre técnicos y POS se cifra antes de salir del cliente."
                value={settings.aes} onChange={v => update('aes', v)}
                icon="key"
              />
              <SwitchRow
                title="Multi-Factor Authentication (MFA)"
                desc="Requiere TOTP o passkey al iniciar sesión en DPS DESK."
                value={settings.mfa} onChange={v => update('mfa', v)}
                icon="shieldCk"
                badge={<span className="chip accent">Recomendado</span>}
              />
              <SwitchRow
                title="Auditoría completa de sesiones"
                desc="Registra cada conexión, comando y transferencia con sello de tiempo."
                value={settings.audit} onChange={v => update('audit', v)}
                icon="history"
              />
              <SwitchRow
                title="Bloqueo automático de cuentas"
                desc="Bloquear tras 5 intentos fallidos durante 15 minutos."
                value={settings.notify} onChange={v => update('notify', v)}
                icon="lock"
              />

              <div className="hr" style={{ margin: '8px 0' }}/>

              <Field label={`Tiempo de sesión inactiva (${settings.sessionTimeout} min)`} hint="Cierra automáticamente sesiones inactivas.">
                <input type="range" min="5" max="120" step="5" value={settings.sessionTimeout} onChange={e => update('sessionTimeout', +e.target.value)} style={{ width: '100%', accentColor: 'var(--accent-600)' }}/>
              </Field>

              <div style={{
                padding: 16, borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-50)',
                border: '1px solid var(--accent-200)',
                display: 'flex', gap: 12,
              }}>
                <Icon name="info" size={16} style={{ color: 'var(--accent-700)', flexShrink: 0, marginTop: 2 }}/>
                <div style={{ fontSize: 12 }}>
                  <strong style={{ color: 'var(--accent-800)' }}>Compliance:</strong>
                  <span style={{ color: 'var(--accent-700)', marginLeft: 4 }}>
                    Tu configuración cumple con HIPAA · ISO 27001 · SOC 2.
                  </span>
                </div>
              </div>
            </Section>
          )}

          {section === 'sessions' && (
            <Section title="Sesiones remotas" subtitle="Comportamiento durante el control remoto de POS.">
              <SwitchRow title="Auto-actualización del cliente" desc="Distribuye nuevas versiones del cliente RustDesk automáticamente." value={settings.autoUpdate} onChange={v => update('autoUpdate', v)} icon="download"/>
              <SwitchRow title="Mostrar consentimiento al cajero" desc="El POS muestra un aviso al iniciar la conexión remota." value={true} onChange={() => {}} icon="user"/>
              <SwitchRow title="Grabar pantalla en cada sesión" desc="Almacena el video durante 30 días para auditoría." value={false} onChange={() => {}} icon="monitor"/>
              <SwitchRow title="Permitir transferencia de archivos" desc="Habilita el modo SFTP entre técnico y POS." value={true} onChange={() => {}} icon="file"/>
            </Section>
          )}

          {section === 'notify' && (
            <Section title="Notificaciones" subtitle="¿Cuándo y cómo te avisamos?">
              <SwitchRow title="POS desconectado &gt; 5 min" desc="Email + push" value={true} onChange={() => {}} icon="bell"/>
              <SwitchRow title="Pico de fallas en una empresa" desc="3+ POS offline en una sucursal" value={true} onChange={() => {}} icon="bell"/>
              <SwitchRow title="Resumen diario por correo" desc="Te lo enviamos a las 08:00 hora local" value={false} onChange={() => {}} icon="mail"/>
              <SwitchRow title="Webhook a Slack #ops-alerts" desc="https://hooks.slack.com/…" value={true} onChange={() => {}} icon="link"/>
            </Section>
          )}

          {section === 'team' && (
            <Section title="Equipo y permisos" subtitle="Administra roles y acceso al workspace.">
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {[
                  { n: 'Sebastián G.', email: 'sebastian@digitalpharma.cl', role: 'Admin',     last: 'Hace 2 min', you: true },
                  { n: 'Paula Ríos',   email: 'paula.rios@digitalpharma.cl', role: 'Operador', last: 'Hace 1 h' },
                  { n: 'Tech López',   email: 'tech.lopez@dps.cl',           role: 'Técnico',  last: 'Hace 3 h' },
                  { n: 'Soporte 24/7', email: 'soporte@dps.cl',              role: 'Solo lectura', last: 'Ayer' },
                ].map((u, i, arr) => (
                  <div key={u.email} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <span className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{u.n.split(' ').map(s => s[0]).join('').slice(0,2)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{u.n} {u.you && <span style={{ color: 'var(--fg-subtle)', fontWeight: 400, marginLeft: 4 }}>(tú)</span>}</div>
                      <div style={{ fontSize: 11, color: 'var(--fg-subtle)' }}>{u.email}</div>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--fg-subtle)' }}>{u.last}</span>
                    <select className="btn btn-sm" style={{ background: 'var(--surface)' }} defaultValue={u.role}>
                      <option>Admin</option><option>Operador</option><option>Técnico</option><option>Solo lectura</option>
                    </select>
                    <button className="btn-ghost" style={{ padding: 4, color: 'var(--fg-muted)' }}><Icon name="moreH" size={14}/></button>
                  </div>
                ))}
              </div>
              <button className="btn btn-primary"><Icon name="plus" size={13}/> Invitar miembro</button>
            </Section>
          )}

          {section === 'billing' && (
            <Section title="Facturación" subtitle="Plan y consumo de la red.">
              <div className="card" style={{ padding: 22 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--accent-50)', color: 'var(--accent-700)', display: 'grid', placeItems: 'center' }}>
                    <Icon name="zap" size={20}/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>Plan Enterprise</div>
                    <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>Hasta 100 dispositivos · sesiones ilimitadas · soporte 24/7</div>
                  </div>
                  <button className="btn">Cambiar plan</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 18 }}>
                  <div><div className="label-meta">Dispositivos</div><div className="num" style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>16 / 100</div></div>
                  <div><div className="label-meta">Próx. cargo</div><div className="num" style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>$ 480.000</div></div>
                  <div><div className="label-meta">Renovación</div><div style={{ fontSize: 13, fontWeight: 500, marginTop: 4 }}>15 mayo 2026</div></div>
                </div>
              </div>
            </Section>
          )}

          {section === 'about' && (
            <Section title="Acerca de DPS DESK" subtitle="Información del sistema.">
              <div className="card" style={{ padding: 22 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', rowGap: 12, fontSize: 13 }}>
                  <span style={{ color: 'var(--fg-muted)' }}>Versión</span><span className="mono">DPS DESK v4.2.1</span>
                  <span style={{ color: 'var(--fg-muted)' }}>Núcleo</span><span className="mono">RustDesk Server 1.1.11</span>
                  <span style={{ color: 'var(--fg-muted)' }}>Región</span><span>us-east-1 (Virginia)</span>
                  <span style={{ color: 'var(--fg-muted)' }}>Último despliegue</span><span>22 abr 2026 · 14:32</span>
                  <span style={{ color: 'var(--fg-muted)' }}>Soporte</span><span><a href="#" style={{ color: 'var(--accent-600)', textDecoration: 'none' }}>soporte@digitalpharma.cl</a></span>
                </div>
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>{title}</h3>
        {subtitle && <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--fg-muted)' }}>{subtitle}</p>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 500, marginBottom: 6, display: 'block' }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: 11, color: 'var(--fg-subtle)', marginTop: 6, lineHeight: 1.5 }}>{hint}</p>}
    </div>
  );
}

function SwitchRow({ title, desc, value, onChange, icon, badge }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 18px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)' }}>
      {icon && <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-2)', color: 'var(--fg-muted)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name={icon} size={14}/></div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }} dangerouslySetInnerHTML={{ __html: title }}/>
          {badge}
        </div>
        <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 4, lineHeight: 1.5 }}>{desc}</div>
      </div>
      <div className="toggle" data-on={value} onClick={() => onChange(!value)}/>
    </div>
  );
}

window.ConfigScreen = ConfigScreen;
