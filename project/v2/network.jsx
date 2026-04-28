/* global React */
const { useState, useEffect } = React;

function NetworkScreen({ onConnect, onConnectTool, onTunnel, onRdp, initialCompany, deviceOverrides = {}, onUpdateDevice }) {
  const { COMPANIES_FULL } = window.MOCK;
  const startCompany = (initialCompany && COMPANIES_FULL.find(c => c.id === initialCompany))
    ? initialCompany
    : COMPANIES_FULL[0].id;
  const startLocation = COMPANIES_FULL.find(c => c.id === startCompany).locations[0].id;
  const [selectedCompany, setSelectedCompany] = useState(startCompany);
  const [selectedLocation, setSelectedLocation] = useState(startLocation);
  const [addModal, setAddModal] = useState(null); // null | 'company' | 'location' | 'device'
  const [deviceFilter, setDeviceFilter] = useState('');

  const company = COMPANIES_FULL.find(c => c.id === selectedCompany);
  const location = company.locations.find(l => l.id === selectedLocation);

  return (
    <div className="fade-in" style={{ padding: '0 28px 60px', display: 'grid', gridTemplateColumns: '260px 1fr', gap: 0, borderTop: '1px solid var(--line)', minHeight: 'calc(100vh - 140px)' }}>
      {/* Companies column */}
      <div style={{ borderRight: '1px solid var(--line)', padding: '20px 0', display: 'flex', flexDirection: 'column', background: 'var(--paper-up)' }}>
        <div className="col-header">
          <div className="col-header-left">
            <div className="col-header-text">
              <div className="display col-header-title">Empresas</div>
              <div className="mono col-header-meta">{COMPANIES_FULL.length} registradas</div>
            </div>
          </div>
          <button onClick={() => setAddModal('company')} className="add-mini" title="Agregar empresa">
            <Icon name="plus" size={11}/>
          </button>
        </div>
        {COMPANIES_FULL.map((c, i) => {
          const active = c.id === selectedCompany;
          return (
            <button key={c.id} onClick={() => { setSelectedCompany(c.id); setSelectedLocation(c.locations[0].id); }}
              style={{
                width: '100%', textAlign: 'left',
                padding: '14px 20px',
                borderTop: '1px solid var(--line)',
                background: active ? 'var(--paper-2)' : 'transparent',
                borderLeft: active ? '2px solid var(--plum)' : '2px solid transparent',
                cursor: 'pointer',
              }}>
              <div className="serial" style={{ fontSize: 9 }}>EMP-{String(i+1).padStart(2,'0')}</div>
              <div style={{ fontSize: 13, fontWeight: 500, marginTop: 4 }}>{c.name}</div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 6, display: 'flex', gap: 10 }}>
                <span>{c.locations.length} locales</span>
                <span>·</span>
                <span>{c.totalPos} POS</span>
                {c.offline > 0 && <span style={{ color: 'var(--bad)', marginLeft: 'auto' }}>● {c.offline}</span>}
              </div>
            </button>
          );
        })}
        <button onClick={() => setAddModal('company')} className="add-row">
          <Icon name="plus" size={16}/>
          <span>Nueva empresa</span>
        </button>
      </div>

      {/* Locations column */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 0 }}>
        <div style={{ borderRight: '1px solid var(--line)', padding: '20px 0', display: 'flex', flexDirection: 'column', background: 'var(--paper-up)' }}>
          <div className="col-header">
            <div className="col-header-left">
              <div className="col-header-text">
                <div className="display col-header-title">Locales</div>
                <div className="mono col-header-meta">{company.locations.length} en {company.name}</div>
              </div>
            </div>
            <button onClick={() => setAddModal('location')} className="add-mini" title="Agregar local">
              <Icon name="plus" size={11}/>
            </button>
          </div>
          {company.locations.map((l, i) => {
            const active = l.id === selectedLocation;
            return (
              <button key={l.id} onClick={() => setSelectedLocation(l.id)}
                style={{
                  width: '100%', textAlign: 'left', padding: '12px 20px',
                  borderTop: '1px solid var(--line)',
                  background: active ? 'var(--paper-2)' : 'transparent',
                  borderLeft: active ? '2px solid var(--plum)' : '2px solid transparent',
                  cursor: 'pointer',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`dot ${l.offline > 0 ? 'bad' : 'ok'}`}/>
                  <span style={{ fontSize: 12, fontWeight: 500, flex: 1 }}>{l.name}</span>
                  <span className="num mono" style={{ fontSize: 10, color: 'var(--ink-mute)' }}>{l.online}/{l.total}</span>
                </div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 4, paddingLeft: 14 }}>{l.address}</div>
              </button>
            );
          })}
          <button onClick={() => setAddModal('location')} className="add-row">
            <Icon name="plus" size={16}/>
            <span>Nuevo local en {company.name}</span>
          </button>
        </div>

        {/* Devices column */}
        <div style={{ padding: '24px 24px 40px' }}>
          <div className="crumbs" style={{ marginBottom: 18 }}>
            <button>Empresas</button>
            <span className="crumbs-sep">/</span>
            <button>{company.name}</button>
            <span className="crumbs-sep">/</span>
            <button data-current="true">{location.name}</button>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22 }}>
            <div>
              <h2 className="display" style={{ fontSize: 32, margin: 0 }}>{location.name}</h2>
              <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 6 }} className="mono">{location.address} · {location.total} dispositivos</div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div className="filter-input-wrap">
                <Icon name="search" size={12}/>
                <input
                  type="text"
                  value={deviceFilter}
                  onChange={e => setDeviceFilter(e.target.value)}
                  placeholder="Filtrar dispositivos…"
                  className="filter-input"
                />
                {deviceFilter && (
                  <button onClick={() => setDeviceFilter('')} className="filter-clear" aria-label="Limpiar">
                    <Icon name="x" size={10}/>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Device cards (terminal style) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
            {location.devices
              .filter(d => !(deviceOverrides[d.id] && deviceOverrides[d.id].deleted))
              .map(d => {
                const ov = deviceOverrides[d.id] || {};
                return ov.name ? { ...d, name: ov.name } : d;
              })
              .filter(d => {
                if (!deviceFilter.trim()) return true;
                const q = deviceFilter.toLowerCase();
                return (d.name || '').toLowerCase().includes(q)
                  || (d.id || '').toLowerCase().includes(q)
                  || (d.os || '').toLowerCase().includes(q)
                  || (d.rustdesk || '').toLowerCase().includes(q);
              })
              .map(d => (
                <DeviceCard
                  key={d.id}
                  d={d}
                  onConnect={onConnect}
                  onConnectTool={onConnectTool}
                  onTunnel={onTunnel}
                  onRdp={onRdp}
                  onDelete={() => onUpdateDevice && onUpdateDevice(d.id, { deleted: true })}
                  onRename={(newName) => onUpdateDevice && onUpdateDevice(d.id, { name: newName })}
                />
              ))}
            <AddDeviceCard onClick={() => setAddModal('device')}/>
          </div>
        </div>
      </div>

      {addModal && (
        <AddModal
          kind={addModal}
          company={company}
          location={location}
          companies={COMPANIES_FULL}
          onClose={() => setAddModal(null)}
        />
      )}
    </div>
  );
}

function DeviceCard({ d, onConnect, onConnectTool, onTunnel, onRdp, onDelete, onRename }) {
  const tone = d.status === 'online' ? 'good' : d.status === 'idle' ? 'warn' : 'bad';
  const label = d.status === 'online' ? 'CONECTADO' : d.status === 'idle' ? 'INACTIVO' : 'DESCONECTADO';
  const lastSeenLabel = d.lastSeen ? `Última actividad: ${d.lastSeen}` : 'Sin actividad reciente';
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionFlash, setActionFlash] = useState(null);
  const [renaming, setRenaming] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const name = d.name;

  const flash = (msg) => { setActionFlash(msg); setTimeout(() => setActionFlash(null), 2400); };
  const close = () => setMenuOpen(false);

  return (
    <div className="card card-hover" style={{ padding: 0, overflow: 'visible', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Top: monitor glyph + serial + dots menu */}
      <div style={{ padding: '18px 18px 0', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 'var(--r-sm)',
          background: 'var(--paper-2)',
          border: '1px solid var(--line)',
          display: 'grid', placeItems: 'center',
          color: 'var(--ink)',
        }}>
          <Icon name="monitor" size={18}/>
        </div>
        <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
          <div className="serial" style={{ fontSize: 9 }}>POS · {d.os || 'Windows'}</div>
        </div>
        <button className="btn-ghost" style={{ padding: 4, color: 'var(--ink-soft)' }} onClick={() => setMenuOpen(o => !o)} aria-label="Acciones">
          <Icon name="dots" size={14}/>
        </button>
      </div>
      {menuOpen && (
        <>
          <div onClick={close} style={{ position: 'fixed', inset: 0, zIndex: 40 }}/>
          <div className="device-menu">
            <button className="device-menu-item primary" onClick={() => { close(); d.status !== 'offline' && onConnect && onConnect(d); }} disabled={d.status === 'offline'}>
              <Icon name="arrowRt" size={12}/> Conectar {d.rustdeskId || d.id}
            </button>
            <div className="device-menu-sep"/>
            <button className="device-menu-item" onClick={() => { close(); onConnectTool && onConnectTool(d, 'transfer'); }} disabled={d.status === 'offline'}>
              <Icon name="upload" size={12}/> Transferir archivo
            </button>
            <button className="device-menu-item" onClick={() => { close(); onConnectTool && onConnectTool(d, 'terminal', { admin: false }); }} disabled={d.status === 'offline'}>
              <Icon name="terminal" size={12}/> Terminal <span className="device-menu-tag">beta</span>
            </button>
            <button className="device-menu-item" onClick={() => { close(); onConnectTool && onConnectTool(d, 'terminal', { admin: true }); }} disabled={d.status === 'offline'}>
              <Icon name="terminal" size={12}/> Terminal (Administrador) <span className="device-menu-tag">beta</span>
            </button>
            <button className="device-menu-item" onClick={() => { close(); onTunnel && onTunnel(d); }} disabled={d.status === 'offline'}>
              <Icon name="link" size={12}/> Túnel TCP
            </button>
            <button className="device-menu-item" onClick={() => { close(); onRdp && onRdp(d); }} disabled={d.status === 'offline'}>
              <Icon name="monitor" size={12}/> RDP
            </button>
            <div className="device-menu-sep"/>
            <button className="device-menu-item" onClick={() => { close(); setRenaming(true); }}>
              <Icon name="edit" size={12}/> Renombrar
            </button>
            <button className="device-menu-item danger" onClick={() => { close(); setConfirmDel(true); }}>
              <Icon name="x" size={12}/> Eliminar
            </button>
          </div>
        </>
      )}

      {/* Center: name (serif display) */}
      <div style={{ padding: '10px 18px 16px', textAlign: 'center' }}>
        <div className="display" style={{ fontSize: 30, lineHeight: 1, letterSpacing: '-0.01em' }}>{name}</div>
      </div>

      {/* Status chip */}
      <div style={{ padding: '0 18px 14px', display: 'flex', justifyContent: 'center' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '4px 10px',
          borderRadius: 999,
          background: tone === 'good' ? 'var(--good-soft)' : `var(--${tone}-soft)`,
          color: tone === 'good' ? 'var(--good)' : `var(--${tone})`,
          fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
        }}>
          <span className="dot-wrap"><span className={`dot ${tone === 'good' ? 'ok' : tone}${d.status === 'online' ? ' live' : ''}`} style={{ color: tone === 'good' ? 'var(--good)' : `var(--${tone})` }}/></span>
          {label}
        </span>
      </div>

      {/* Metadata list */}
      <div style={{ padding: '14px 18px 16px', borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 9 }}>
        <MetaRow icon="building" label="EMPRESA"     value={d.company}/>
        <MetaRow icon="store"    label="LOCAL"       value={d.localCod}/>
        <MetaRow icon="link"     label="ID DPS DESK" value={d.rustdeskId} mono/>
      </div>

      {/* Last activity strip */}
      <div style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink-mute)', fontSize: 10, borderTop: '1px solid var(--line)' }}>
        <Icon name="activity" size={11}/>
        <span className="mono" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{lastSeenLabel}</span>
      </div>

      {/* Primary action */}
      <button
        disabled={d.status === 'offline'}
        onClick={() => d.status !== 'offline' && onConnect && onConnect(d)}
        className="connect-btn"
        data-disabled={d.status === 'offline'}
      >
        <Icon name="arrowRt" size={13}/>
        Conectar vía DPS Desk
      </button>

      {/* Action flash toast */}
      {actionFlash && (
        <div className="device-toast">
          <Icon name="check" size={12}/> {actionFlash}
        </div>
      )}

      {/* Rename modal */}
      {renaming && <RenameDeviceModal current={name} onClose={() => setRenaming(false)} onSave={(nv) => { onRename && onRename(nv); setRenaming(false); flash('Dispositivo renombrado a "' + nv + '".'); }}/>}
      {/* Confirm delete */}
      {confirmDel && <ConfirmDeleteDeviceModal name={name} onClose={() => setConfirmDel(false)} onConfirm={() => { setConfirmDel(false); onDelete && onDelete(); }}/>}
    </div>
  );
}

function RenameDeviceModal({ current, onClose, onSave }) {
  const [v, setV] = useState(current);
  const ok = v.trim().length > 0 && v !== current;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-shell modal-compact" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="modal-head-compact">
          <div style={{ flex: 1 }}>
            <h3 style={{ fontFamily: 'var(--sans)', fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '0.02em', textTransform: 'uppercase' }}>Renombrar dispositivo</h3>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', marginTop: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>El cambio se propaga al ID interno.</div>
          </div>
          <button onClick={onClose} className="btn-icon-close"><Icon name="x" size={14}/></button>
        </div>
        <div style={{ padding: 24 }}>
          <label>
            <div className="serial" style={{ marginBottom: 6 }}>Nombre del dispositivo</div>
            <input className="input mono" autoFocus value={v} onChange={e => setV(e.target.value)} style={{ fontSize: 13 }}/>
          </label>
          <div style={{ display: 'flex', gap: 10, marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--line)' }}>
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn btn-acid" style={{ marginLeft: 'auto' }} disabled={!ok} onClick={() => ok && onSave(v.trim())}>
              <Icon name="check" size={12}/> Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteDeviceModal({ name, onClose, onConfirm }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-shell modal-compact" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="modal-head-compact">
          <div style={{ flex: 1 }}>
            <h3 style={{ fontFamily: 'var(--sans)', fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--bad)' }}>Eliminar dispositivo</h3>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', marginTop: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Esta acción no se puede deshacer.</div>
          </div>
          <button onClick={onClose} className="btn-icon-close"><Icon name="x" size={14}/></button>
        </div>
        <div style={{ padding: 24 }}>
          <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink)', margin: 0 }}>
            Se eliminará <strong style={{ fontFamily: 'var(--mono)' }}>{name}</strong> de la red. Las sesiones activas se cortarán y el ID Rustdesk dejará de aparecer en el panel.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--line)' }}>
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn" style={{ marginLeft: 'auto', background: 'var(--bad)', borderColor: 'var(--bad)', color: '#FFF' }} onClick={onConfirm}>
              <Icon name="x" size={12}/> Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaRow({ icon, label, value, mono }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '14px 92px 1fr', alignItems: 'center', gap: 10 }}>
      <Icon name={icon} size={12} style={{ color: 'var(--ink-soft)' }}/>
      <span className="serial" style={{ fontSize: 9 }}>{label}</span>
      <span style={{
        fontSize: 12, fontWeight: 600, color: 'var(--ink)',
        textAlign: 'right',
        fontFamily: mono ? 'var(--mono)' : 'inherit',
        letterSpacing: mono ? '0.02em' : 0,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{value}</span>
    </div>
  );
}

function AddDeviceCard({ onClick }) {
  return (
    <button onClick={onClick} className="add-card">
      <div className="add-card-glyph">
        <Icon name="plus" size={22}/>
      </div>
      <div className="display" style={{ fontSize: 18, color: 'var(--ink)' }}>Agregar dispositivo</div>
      <div className="mono" style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Vincula un nuevo POS
      </div>
    </button>
  );
}

function AddModal({ kind, company, location, companies, onClose }) {
  const config = {
    company: {
      title: 'Nueva empresa',
      subtitle: 'Ingresa los datos requeridos',
      icon: 'building',
      fields: [
        { id: 'name', label: 'Empresa', placeholder: 'Nombre de la empresa', type: 'text', required: true, autoFocus: true },
        { id: 'cod',  label: 'Sucursal de identificación', placeholder: 'Número de sucursal', type: 'text', mono: true },
      ],
    },
    location: {
      title: 'Nuevo local',
      subtitle: `Empresa: ${company.name}`,
      icon: 'store',
      fields: [
        { id: 'name', label: 'Nombre del local', placeholder: 'Ej: Santa Rosa', type: 'text', required: true, autoFocus: true },
        { id: 'cod',  label: 'Número de local / código', placeholder: 'Ej: 001', type: 'text', mono: true },
      ],
    },
    device: {
      title: 'Nuevo dispositivo',
      subtitle: `${company.name}${location ? ' · ' + location.name : ''}`,
      icon: 'monitor',
      fields: [
        { id: 'rustdesk', label: 'ID RustDesk', placeholder: '123 456 789', type: 'text', mono: true, required: true, autoFocus: true },
      ],
    },
  }[kind];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-shell modal-compact" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-head-compact">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              fontFamily: 'var(--sans)',
              fontSize: 18,
              fontWeight: 700,
              margin: 0,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              color: 'var(--ink)',
            }}>
              {config.title}
            </h3>
            <div className="mono" style={{
              fontSize: 10,
              color: 'var(--ink-mute)',
              marginTop: 6,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              {config.subtitle}
            </div>
          </div>
          <button onClick={onClose} className="btn-icon-close" aria-label="Cerrar">
            <Icon name="x" size={14}/>
          </button>
        </div>

        {/* Form */}
        <form className="modal-body-compact" onSubmit={e => { e.preventDefault(); onClose(); }}>
          {config.fields.map(f => (
            <div key={f.id} className="form-row-compact">
              <label className="form-label-compact">
                {f.label}
                {f.required && <span style={{ color: 'var(--bad)', marginLeft: 4 }}>*</span>}
              </label>
              <input
                autoFocus={f.autoFocus}
                className={'input-compact' + (f.mono ? ' mono' : '')}
                type={f.type}
                placeholder={f.placeholder}
              />
            </div>
          ))}

          <div className="modal-foot-compact">
            <button type="button" onClick={onClose} className="btn-cancel-compact">Cancelar</button>
            <button type="submit" className="btn-save-compact">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// === TCP Tunnel modal — port forwarding to a remote DB or service over the device's network
function TcpTunnelModal({ device, onClose }) {
  const presets = [
    { label: 'PostgreSQL', port: '5432' },
    { label: 'MySQL',      port: '3306' },
    { label: 'SQL Server', port: '1433' },
    { label: 'MongoDB',    port: '27017' },
    { label: 'Redis',      port: '6379' },
  ];

  const [localPort,  setLocalPort]  = useState('');
  const [remoteHost, setRemoteHost] = useState('localhost');
  const [remotePort, setRemotePort] = useState('');
  const [tunnels,    setTunnels]    = useState([]);
  const [flash,      setFlash]      = useState(null);

  const validPort = (v) => /^\d+$/.test(v) && Number(v) > 0 && Number(v) <= 65535;
  const canAdd = validPort(localPort) && validPort(remotePort) && (remoteHost || '').trim().length > 0;
  const localTaken = tunnels.some(t => t.local === localPort);

  const add = (e) => {
    e?.preventDefault();
    if (!canAdd || localTaken) return;
    const t = {
      id: Date.now(),
      local: localPort,
      host: (remoteHost || 'localhost').trim(),
      remote: remotePort,
    };
    setTunnels(arr => [...arr, t]);
    setFlash(`Túnel activo · 127.0.0.1:${t.local} → ${t.host}:${t.remote}`);
    setTimeout(() => setFlash(null), 2400);
    setLocalPort('');
    setRemotePort('');
    setRemoteHost('localhost');
  };

  const remove = (id) => setTunnels(arr => arr.filter(t => t.id !== id));

  const usePreset = (p) => setRemotePort(p.port);

  const inputStyle = { width: '100%', height: 38, fontSize: 13 };
  const labelStyle = { display: 'block', marginBottom: 6 };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-shell" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="modal-head-compact">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--r-sm)', background: 'var(--plum-soft)', color: 'var(--plum)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icon name="link" size={16}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontFamily: 'var(--sans)', fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--ink)' }}>
                Túnel TCP
              </h3>
              <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', marginTop: 6, letterSpacing: '0.08em', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {device.name} · {device.rustdeskId} · {device.company}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon-close" aria-label="Cerrar">
            <Icon name="x" size={14}/>
          </button>
        </div>

        <form onSubmit={add} style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 1fr', gap: 12, marginBottom: 14 }}>
            <label>
              <div className="serial" style={labelStyle}>Puerto local</div>
              <input
                className="input mono"
                style={inputStyle}
                type="text" inputMode="numeric"
                placeholder="15432"
                value={localPort}
                onChange={e => setLocalPort(e.target.value.replace(/[^\d]/g, '').slice(0, 5))}
                autoFocus
              />
            </label>
            <label>
              <div className="serial" style={labelStyle}>Anfitrión remoto</div>
              <input
                className="input mono"
                style={inputStyle}
                placeholder="localhost"
                value={remoteHost}
                onChange={e => setRemoteHost(e.target.value)}
              />
            </label>
            <label>
              <div className="serial" style={labelStyle}>Puerto remoto</div>
              <input
                className="input mono"
                style={inputStyle}
                type="text" inputMode="numeric"
                placeholder="5432"
                value={remotePort}
                onChange={e => setRemotePort(e.target.value.replace(/[^\d]/g, '').slice(0, 5))}
              />
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--ink-soft)', letterSpacing: '0.06em', textTransform: 'uppercase', marginRight: 4 }}>Presets:</span>
            {presets.map(p => (
              <button key={p.port} type="button" onClick={() => usePreset(p)}
                className="btn btn-sm"
                style={{ height: 24, padding: '0 10px', fontSize: 11 }}>
                {p.label} · {p.port}
              </button>
            ))}
          </div>

          {localTaken && (
            <div className="mono" style={{ fontSize: 11, color: 'var(--bad)', marginBottom: 10 }}>
              <Icon name="x" size={11}/> El puerto local {localPort} ya está en uso por otro túnel.
            </div>
          )}

          <button
            type="submit"
            className="btn btn-acid"
            disabled={!canAdd || localTaken}
            style={{
              width: '100%', justifyContent: 'center', height: 44,
              background: 'var(--plum)', borderColor: 'var(--plum-2)', color: '#FFFFFF',
              opacity: (!canAdd || localTaken) ? 0.5 : 1,
              cursor: (!canAdd || localTaken) ? 'not-allowed' : 'pointer',
              letterSpacing: '0.08em', fontWeight: 700, textTransform: 'uppercase', fontSize: 13,
            }}>
            <Icon name="plus" size={13}/> Agregar
          </button>

          {flash && (
            <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--good-soft)', color: 'var(--good)', borderRadius: 'var(--r-sm)', fontSize: 12, fontFamily: 'var(--mono)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="check" size={12}/> {flash}
            </div>
          )}

          {/* Active tunnels table */}
          <div style={{ marginTop: 22, border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', overflow: 'hidden' }}>
            <div className="row" style={{
              gridTemplateColumns: '1fr 1.4fr 1fr 60px',
              background: 'var(--paper-2)',
              height: 38, padding: '0 14px',
              borderBottom: '1px solid var(--line)',
            }}>
              <span className="serial" style={{ fontSize: 10 }}>Puerto local</span>
              <span className="serial" style={{ fontSize: 10 }}>Anfitrión remoto</span>
              <span className="serial" style={{ fontSize: 10 }}>Puerto remoto</span>
              <span className="serial" style={{ fontSize: 10, textAlign: 'right' }}>Acción</span>
            </div>
            {tunnels.length === 0 ? (
              <div style={{ padding: '38px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--ink-soft)' }}>
                <Icon name="link" size={20} style={{ opacity: 0.4 }}/>
                <span className="mono" style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>No hay túneles activos</span>
              </div>
            ) : (
              tunnels.map((t, i) => (
                <div key={t.id} className="row" style={{
                  gridTemplateColumns: '1fr 1.4fr 1fr 60px',
                  height: 44, padding: '0 14px',
                  borderBottom: i < tunnels.length - 1 ? '1px solid var(--line)' : 'none',
                  fontFamily: 'var(--mono)', fontSize: 12,
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="dot ok live"/>
                    <span>127.0.0.1:{t.local}</span>
                  </span>
                  <span style={{ color: 'var(--ink-mute)' }}>{t.host}</span>
                  <span>{t.remote}</span>
                  <button
                    type="button"
                    onClick={() => remove(t.id)}
                    className="btn-ghost"
                    style={{ marginLeft: 'auto', padding: 6, color: 'var(--bad)' }}
                    aria-label="Detener túnel"
                    title="Detener túnel"
                  >
                    <Icon name="x" size={13}/>
                  </button>
                </div>
              ))
            )}
          </div>

          {tunnels.length > 0 && (
            <div className="mono" style={{ marginTop: 12, fontSize: 10, color: 'var(--ink-soft)', letterSpacing: '0.04em' }}>
              Los túneles se cierran al desconectar el dispositivo. Para conectarte usa <span style={{ color: 'var(--ink)' }}>127.0.0.1:&lt;puerto local&gt;</span> desde tu PC.
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// === RDP modal — port-forwards remote 3389 to a local port and simulates the Windows RDP client launch
function RdpModal({ device, onClose }) {
  const [sessions, setSessions] = useState([]);
  const [launching, setLaunching] = useState(null); // session being launched

  const usedPorts = sessions.map(s => s.local);
  const allocPort = () => {
    let p;
    do { p = String(50000 + Math.floor(Math.random() * 15000)); }
    while (usedPorts.includes(p));
    return p;
  };

  const newRdp = () => {
    const port = allocPort();
    const session = {
      id: Date.now(),
      local: port,
      host: 'localhost',
      remote: '3389',
      label: `${device.name}@${(device.name || 'desktop').toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setSessions(arr => [...arr, session]);
    launch(session);
  };

  const launch = (s) => {
    setLaunching(s);
    setTimeout(() => setLaunching(null), 2200);
  };

  const remove = (id) => setSessions(arr => arr.filter(s => s.id !== id));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-shell" onClick={e => e.stopPropagation()} style={{ maxWidth: 720, position: 'relative' }}>
        <div className="modal-head-compact">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--r-sm)', background: 'var(--plum-soft)', color: 'var(--plum)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icon name="monitor" size={16}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontFamily: 'var(--sans)', fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--ink)' }}>
                Escritorio remoto · RDP
              </h3>
              <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', marginTop: 6, letterSpacing: '0.08em', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {device.name} · {device.rustdeskId} · {device.company}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon-close" aria-label="Cerrar">
            <Icon name="x" size={14}/>
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {/* Listening banner */}
          <div style={{
            background: '#3CB371',
            color: '#FFFFFF',
            padding: '14px 18px',
            borderRadius: 'var(--r-sm)',
            display: 'flex', alignItems: 'center', gap: 12,
            marginBottom: 18,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: '#FFFFFF', boxShadow: '0 0 0 4px rgba(255,255,255,0.3)', flexShrink: 0 }}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.02em' }}>Escuchando…</div>
              <div className="mono" style={{ fontSize: 11, marginTop: 3, opacity: 0.9 }}>
                No cierres esta ventana mientras estés usando el túnel.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={newRdp}
            className="btn"
            style={{
              width: '100%', justifyContent: 'center', height: 44,
              background: 'var(--plum)', borderColor: 'var(--plum-2)', color: '#FFFFFF',
              letterSpacing: '0.08em', fontWeight: 700, textTransform: 'uppercase', fontSize: 13,
              marginBottom: 18,
            }}>
            <Icon name="plus" size={13}/> Nuevo RDP
          </button>

          {/* Active sessions table */}
          <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', overflow: 'hidden' }}>
            <div className="row" style={{
              gridTemplateColumns: '1fr 1.4fr 1fr 70px',
              background: 'var(--paper-2)',
              height: 38, padding: '0 14px',
              borderBottom: '1px solid var(--line)',
            }}>
              <span className="serial" style={{ fontSize: 10 }}>Puerto local</span>
              <span className="serial" style={{ fontSize: 10 }}>Anfitrión remoto</span>
              <span className="serial" style={{ fontSize: 10 }}>Puerto remoto</span>
              <span className="serial" style={{ fontSize: 10, textAlign: 'right' }}>Acción</span>
            </div>
            {sessions.length === 0 ? (
              <div style={{ padding: '38px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--ink-soft)' }}>
                <Icon name="monitor" size={20} style={{ opacity: 0.4 }}/>
                <span className="mono" style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>No hay sesiones RDP activas</span>
              </div>
            ) : (
              sessions.map((s, i) => (
                <div key={s.id} className="row" style={{
                  gridTemplateColumns: '1fr 1.4fr 1fr 70px',
                  height: 46, padding: '0 14px',
                  borderBottom: i < sessions.length - 1 ? '1px solid var(--line)' : 'none',
                  fontFamily: 'var(--mono)', fontSize: 12,
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="dot ok live"/>
                    <span>{s.local}</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink-mute)' }}>
                    <Icon name="arrowRt" size={11} style={{ color: 'var(--plum)' }}/>
                    <span>{s.host}</span>
                  </span>
                  <span>{s.remote} <span className="serial" style={{ fontSize: 9, color: 'var(--ink-soft)', marginLeft: 4 }}>RDP</span></span>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, marginLeft: 'auto' }}>
                    <button type="button" onClick={() => launch(s)} className="btn-ghost" style={{ padding: 6, color: 'var(--plum)' }} title="Lanzar cliente RDP">
                      <Icon name="arrowRt" size={13}/>
                    </button>
                    <button type="button" onClick={() => remove(s.id)} className="btn-ghost" style={{ padding: 6, color: 'var(--bad)' }} title="Detener túnel">
                      <Icon name="x" size={13}/>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mono" style={{ marginTop: 12, fontSize: 10, color: 'var(--ink-soft)', letterSpacing: '0.04em' }}>
            Cada sesión expone el puerto 3389 del POS en <span style={{ color: 'var(--ink)' }}>127.0.0.1:&lt;puerto local&gt;</span>. Usa Conexión a Escritorio Remoto desde tu PC.
          </div>
        </div>

        {/* Launching dialog overlay (mimics the Windows RDP client) */}
        {launching && <RdpLaunchingDialog session={launching} onCancel={() => setLaunching(null)}/>}
      </div>
    </div>
  );
}

function RdpLaunchingDialog({ session, onCancel }) {
  const [progress, setProgress] = useState(8);
  const [phase, setPhase] = useState('Configurando sesión remota…');

  useEffect(() => {
    const phases = [
      { t: 600,  p: 32, msg: 'Iniciando handshake TLS…' },
      { t: 1100, p: 58, msg: 'Negociando credenciales…' },
      { t: 1600, p: 84, msg: 'Cargando escritorio…' },
      { t: 2100, p: 100, msg: 'Conectado.' },
    ];
    const ids = phases.map(ph => setTimeout(() => { setProgress(ph.p); setPhase(ph.msg); }, ph.t));
    return () => ids.forEach(clearTimeout);
  }, [session.id]);

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(0, 0, 0, 0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 5, borderRadius: 'inherit',
    }}>
      <div style={{
        width: 380,
        background: '#F0F0F0',
        color: '#202020',
        border: '1px solid #B7B7B7',
        boxShadow: '0 4px 18px rgba(0,0,0,0.35)',
        borderRadius: 4,
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#E5E5E5', borderBottom: '1px solid #C8C8C8' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
            <span style={{ width: 14, height: 14, background: '#0078D4', display: 'inline-block', borderRadius: 2 }}/>
            Conexión a Escritorio remoto
          </span>
          <button onClick={onCancel} aria-label="Cerrar" style={{ background: 'transparent', border: 0, cursor: 'pointer', color: '#202020', fontSize: 14, lineHeight: 1, padding: 2 }}>
            ✕
          </button>
        </div>
        <div style={{ padding: 18, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 40, height: 40, background: '#0078D4', borderRadius: 4, color: '#FFF', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 18, fontWeight: 700 }}>R</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: '#404040' }}>Conectándose a:</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{session.host}:{session.local}</div>
            <div style={{ height: 14, background: '#FFF', border: '1px solid #B7B7B7', marginTop: 12, position: 'relative', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: progress + '%', background: '#107C10', transition: 'width 240ms ease-out' }}/>
            </div>
            <div style={{ fontSize: 12, color: '#404040', marginTop: 8 }}>{phase}</div>
          </div>
          <button onClick={onCancel} style={{
            border: '1px solid #B7B7B7',
            background: '#F0F0F0',
            padding: '4px 14px',
            fontSize: 12,
            fontFamily: 'inherit',
            cursor: 'pointer',
            borderRadius: 2,
          }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

window.NetworkScreen = NetworkScreen;
window.TcpTunnelModal = TcpTunnelModal;
window.RdpModal = RdpModal;