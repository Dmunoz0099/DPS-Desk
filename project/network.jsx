/* global React */
const { useState, useMemo } = React;

function NetworkScreen({ onConnect, onRefresh }) {
  const { COMPANIES, LOCALES, DEVICES } = window.MOCK;
  const [selectedCompany, setSelectedCompany] = useState(null); // company name
  const [selectedLocal, setSelectedLocal] = useState(null);     // local id
  const [filter, setFilter] = useState('all'); // all | online | offline
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(null); // 'empresa' | 'local' | 'pos' | null

  const currentCompany = selectedCompany ? COMPANIES.find(c => c.name === selectedCompany) : null;
  const currentLocal = selectedLocal ? LOCALES.find(l => l.id === selectedLocal) : null;
  const addType = selectedLocal ? 'pos' : selectedCompany ? 'local' : 'empresa';

  const breadcrumb = (
    <div className="breadcrumb">
      <button data-current={!selectedCompany} onClick={() => { setSelectedCompany(null); setSelectedLocal(null); }}>
        <Icon name="building" size={13} style={{ marginRight: 6, verticalAlign: '-2px' }}/>
        Empresas
      </button>
      {selectedCompany && (<>
        <Icon name="chevronR" size={12}/>
        <button data-current={!selectedLocal} onClick={() => setSelectedLocal(null)}>{selectedCompany}</button>
      </>)}
      {selectedLocal && (<>
        <Icon name="chevronR" size={12}/>
        <button data-current={true}>{LOCALES.find(l => l.id === selectedLocal)?.name}</button>
      </>)}
    </div>
  );

  // Filters
  const filteredDevices = useMemo(() => {
    if (!selectedLocal) return [];
    const local = LOCALES.find(l => l.id === selectedLocal);
    return DEVICES
      .filter(d => d.company === local.company && d.localCod === local.cod)
      .filter(d => filter === 'all' || d.status === filter)
      .filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.rustdeskId.includes(search));
  }, [selectedLocal, filter, search, DEVICES]);

  return (
    <div className="fade-in" style={{ padding: '20px 28px 60px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Top breadcrumb + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{ flex: 1 }}>{breadcrumb}</div>
        <div style={{ position: 'relative' }}>
          <Icon name="search" size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-subtle)' }}/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar…"
            className="input"
            style={{ height: 32, paddingLeft: 30, fontSize: 12, width: 200 }}
          />
        </div>
        <button className="btn btn-sm"><Icon name="filter" size={12}/> Filtros</button>
        <button className="btn btn-sm btn-primary" onClick={() => setAdding(addType)}>
          <Icon name="plus" size={12}/> {addType === 'pos' ? 'Dispositivo' : addType === 'local' ? 'Local' : 'Empresa'}
        </button>
      </div>

      {/* CONTENT */}
      {!selectedCompany && <CompaniesView companies={COMPANIES} locales={LOCALES} onSelect={setSelectedCompany} onAdd={() => setAdding('empresa')}/>}
      {selectedCompany && !selectedLocal && (
        <LocalesView
          company={selectedCompany}
          locales={LOCALES.filter(l => l.company === selectedCompany)}
          onSelect={setSelectedLocal}
          onBack={() => setSelectedCompany(null)}
          onAdd={() => setAdding('local')}
        />
      )}
      {selectedLocal && (
        <DevicesView
          local={LOCALES.find(l => l.id === selectedLocal)}
          devices={filteredDevices}
          totalForLocal={DEVICES.filter(d => {
            const l = LOCALES.find(l => l.id === selectedLocal);
            return d.company === l.company && d.localCod === l.cod;
          })}
          filter={filter} setFilter={setFilter}
          onConnect={onConnect}
          onAdd={() => setAdding('pos')}
          onDelete={async (device) => {
            if (!window.API) return;
            if (!window.confirm(`¿Eliminar ${device.name} (${device.id})?`)) return;
            try {
              await window.API.deletePos(device.id);
              if (onRefresh) await onRefresh();
            } catch (err) {
              alert('Error al eliminar: ' + err.message);
            }
          }}
        />
      )}

      {adding && (
        <AddModal
          type={adding}
          company={currentCompany}
          local={currentLocal}
          onClose={() => setAdding(null)}
          onCreated={async () => {
            setAdding(null);
            if (onRefresh) await onRefresh();
          }}
        />
      )}
    </div>
  );
}

// ----- AddModal: alta unificada (empresa | local | pos) -----
function AddModal({ type, company, local, onClose, onCreated }) {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => Object.assign({}, f, { [k]: v }));

  const titles = {
    empresa: 'Nueva empresa',
    local: 'Nuevo local',
    pos: 'Nuevo dispositivo POS',
  };

  const submit = async (e) => {
    e?.preventDefault();
    setError('');
    if (!window.API) { setError('API no disponible'); return; }
    setLoading(true);
    try {
      if (type === 'empresa') {
        if (!form.id || !form.nombre) throw new Error('id y nombre son requeridos');
        await window.API.createEmpresa({ id: form.id.trim(), nombre: form.nombre.trim() });
      } else if (type === 'local') {
        if (!form.id || !form.nombre) throw new Error('id y nombre son requeridos');
        await window.API.createLocal({
          id: form.id.trim(),
          empresa_id: company?.idSucursal,
          nombre: form.nombre.trim(),
        });
      } else if (type === 'pos') {
        if (!form.id || form.numero === '' || form.numero == null) throw new Error('id y número son requeridos');
        await window.API.createPos({
          id: form.id.trim(),
          numero: parseInt(form.numero, 10),
          local_id: local?._id || local?.cod,
          empresa_id: company?.idSucursal,
          ip: form.ip || null,
          version: form.version || null,
          hardware_os: form.hardware_os || null,
        });
      }
      await onCreated();
    } catch (err) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'grid', placeItems: 'center', zIndex: 70 }}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()} className="card fade-in" style={{ width: 460, padding: 24 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{titles[type]}</h3>
        {type === 'local' && company && (
          <p style={{ margin: '4px 0 14px', fontSize: 12, color: 'var(--fg-muted)' }}>Empresa: <span className="mono">{company.idSucursal}</span> · {company.name}</p>
        )}
        {type === 'pos' && (
          <p style={{ margin: '4px 0 14px', fontSize: 12, color: 'var(--fg-muted)' }}>
            Local: <span className="mono">{local?._id || local?.cod}</span> · {local?.name} · Empresa <span className="mono">{company?.idSucursal}</span>
          </p>
        )}
        {type === 'empresa' && (
          <p style={{ margin: '4px 0 14px', fontSize: 12, color: 'var(--fg-muted)' }}>Crea una nueva organización.</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>ID</div>
            <input className="input" placeholder={type === 'empresa' ? 'ej. farmacia-x' : type === 'local' ? 'ej. local-12' : 'ej. pos-101'} value={form.id || ''} onChange={e => set('id', e.target.value)}/>
          </label>

          {(type === 'empresa' || type === 'local') && (
            <label>
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Nombre</div>
              <input className="input" placeholder={type === 'empresa' ? 'Nombre de la empresa' : 'Nombre del local'} value={form.nombre || ''} onChange={e => set('nombre', e.target.value)}/>
            </label>
          )}

          {type === 'pos' && (
            <>
              <label>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Número</div>
                <input className="input" type="number" placeholder="ej. 101" value={form.numero || ''} onChange={e => set('numero', e.target.value)}/>
              </label>
              <label>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>IP (opcional)</div>
                <input className="input" placeholder="192.168.1.50" value={form.ip || ''} onChange={e => set('ip', e.target.value)}/>
              </label>
              <label>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Versión (opcional)</div>
                <input className="input" placeholder="1.2.16" value={form.version || ''} onChange={e => set('version', e.target.value)}/>
              </label>
              <label>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Sistema operativo (opcional)</div>
                <input className="input" placeholder="Windows 11 Pro" value={form.hardware_os || ''} onChange={e => set('hardware_os', e.target.value)}/>
              </label>
            </>
          )}
        </div>

        {error && (
          <div style={{ marginTop: 12, padding: '8px 10px', borderRadius: 6, fontSize: 12, background: 'var(--err-bg, #fee2e2)', color: 'var(--err, #b91c1c)', border: '1px solid color-mix(in oklab, var(--err, #b91c1c) 30%, transparent)' }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button type="button" className="btn" style={{ flex: 1 }} onClick={onClose} disabled={loading}>Cancelar</button>
          <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
            {loading ? 'Creando…' : 'Crear'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ----- View: companies grid -----
function CompaniesView({ companies, locales, onSelect, onAdd }) {
  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Empresas</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--fg-muted)' }}>{companies.length} organizaciones · {locales.length} locales · {companies.reduce((a,c) => a+c.pos, 0)} dispositivos</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {companies.map(c => {
          const localCount = locales.filter(l => l.company === c.name).length;
          const pct = (c.online / c.pos) * 100;
          return (
            <button key={c.name} onClick={() => onSelect(c.name)} className="card card-hover" style={{
              padding: 18, textAlign: 'left', cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: `color-mix(in oklab, ${c.color} 14%, transparent)`,
                  color: c.color,
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                }}>
                  <Icon name="building" size={18}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</h3>
                    <Icon name="chevronR" size={14} style={{ color: 'var(--fg-subtle)' }}/>
                  </div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--fg-subtle)', marginTop: 2 }}>ID {c.idSucursal}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 16 }}>
                <div>
                  <div className="num" style={{ fontSize: 18, fontWeight: 600 }}>{c.pos}</div>
                  <div style={{ fontSize: 10, color: 'var(--fg-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</div>
                </div>
                <div>
                  <div className="num" style={{ fontSize: 18, fontWeight: 600, color: 'var(--ok)' }}>{c.online}</div>
                  <div style={{ fontSize: 10, color: 'var(--fg-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>En línea</div>
                </div>
                <div>
                  <div className="num" style={{ fontSize: 18, fontWeight: 600, color: c.offline ? 'var(--err)' : 'var(--fg-muted)' }}>{c.offline}</div>
                  <div style={{ fontSize: 10, color: 'var(--fg-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Offline</div>
                </div>
              </div>
              <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden', marginTop: 14 }}>
                <div style={{ width: `${pct}%`, height: '100%', background: c.color, transition: 'width 600ms ease' }}/>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, fontSize: 11, color: 'var(--fg-muted)' }}>
                <span>{localCount} {localCount === 1 ? 'local' : 'locales'}</span>
                <span>{pct.toFixed(0)}% conectividad</span>
              </div>
            </button>
          );
        })}
        {/* Add card */}
        <button onClick={onAdd} className="card" style={{
          padding: 18, textAlign: 'left', cursor: 'pointer',
          borderStyle: 'dashed', background: 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: 220, color: 'var(--fg-muted)',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', margin: '0 auto 10px' }}>
              <Icon name="plus" size={18}/>
            </div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Agregar empresa</div>
            <div style={{ fontSize: 11, marginTop: 2, color: 'var(--fg-subtle)' }}>Conecta una nueva organización</div>
          </div>
        </button>
      </div>
    </>
  );
}

// ----- View: locales list -----
function LocalesView({ company, locales, onSelect, onBack, onAdd }) {
  const totalPos = locales.reduce((a,l) => a+l.pos, 0);
  const totalOnline = locales.reduce((a,l) => a+l.online, 0);
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>{company}</h2>
            <span className="chip ok"><span className="status-dot ok"/>{((totalOnline/totalPos)*100).toFixed(0)}% online</span>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--fg-muted)' }}>
            {locales.length} {locales.length === 1 ? 'local' : 'locales'} · {totalPos} dispositivos · {totalOnline} en línea
          </p>
        </div>
        {onAdd && (
          <button className="btn btn-sm btn-primary" onClick={onAdd}>
            <Icon name="plus" size={12}/> Local
          </button>
        )}
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="row" style={{ gridTemplateColumns: '40px 2fr 1fr 1fr 1.5fr 100px', color: 'var(--fg-subtle)', textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.06em', fontWeight: 500, background: 'var(--surface-2)' }}>
          <span></span>
          <span>Local</span>
          <span>Código</span>
          <span>Ciudad</span>
          <span>Conectividad</span>
          <span></span>
        </div>
        {locales.map(l => {
          const pct = (l.online / l.pos) * 100;
          return (
            <button
              key={l.id}
              className="row"
              onClick={() => onSelect(l.id)}
              style={{ gridTemplateColumns: '40px 2fr 1fr 1fr 1.5fr 100px', cursor: 'pointer', textAlign: 'left' }}
            >
              <Icon name="store" size={16} style={{ color: 'var(--fg-muted)' }}/>
              <span style={{ fontWeight: 500 }}>{l.name}</span>
              <span className="mono" style={{ color: 'var(--fg-muted)', fontSize: 12 }}>{l.cod}</span>
              <span style={{ color: 'var(--fg-muted)', fontSize: 12 }}>{l.city}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, maxWidth: 140, height: 4, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: l.offline ? (l.offline > l.online ? 'var(--err)' : 'var(--warn)') : 'var(--ok)' }}/>
                </div>
                <span className="mono" style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{l.online}/{l.pos}</span>
              </span>
              <span style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
                {l.offline > 0 && <span className="chip err" style={{ padding: '2px 6px', fontSize: 10 }}>{l.offline}</span>}
                <Icon name="chevronR" size={14} style={{ color: 'var(--fg-subtle)' }}/>
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ----- View: devices grid -----
function DevicesView({ local, devices, totalForLocal, filter, setFilter, onConnect, onAdd, onDelete }) {
  const [openMenu, setOpenMenu] = useState(null);
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>{local.name}</h2>
            <span className="chip"><Icon name="map" size={11}/>{local.city}</span>
            <span className="chip"><span className="mono">cod {local.cod}</span></span>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--fg-muted)' }}>
            {totalForLocal.length} dispositivos POS · {totalForLocal.filter(d => d.status === 'online').length} en línea
          </p>
        </div>
        <div className="segmented">
          <button data-active={filter === 'all'}     onClick={() => setFilter('all')}>Todos · {totalForLocal.length}</button>
          <button data-active={filter === 'online'}  onClick={() => setFilter('online')}><span className="status-dot ok"/>En línea</button>
          <button data-active={filter === 'offline'} onClick={() => setFilter('offline')}><span className="status-dot err"/>Offline</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {devices.map(d => (
          <DeviceCard key={d.id} d={d} openMenu={openMenu} setOpenMenu={setOpenMenu} onConnect={() => onConnect(d)} onDelete={() => onDelete && onDelete(d)}/>
        ))}
        {/* Add */}
        <button onClick={onAdd} className="card" style={{
          padding: 18, textAlign: 'center', cursor: 'pointer',
          borderStyle: 'dashed', background: 'transparent',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: 198, color: 'var(--fg-muted)',
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', marginBottom: 10 }}>
            <Icon name="plus" size={16}/>
          </div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Añadir dispositivo</div>
          <div style={{ fontSize: 11, marginTop: 2, color: 'var(--fg-subtle)' }}>Registra un nuevo POS</div>
        </button>
        {devices.length === 0 && (
          <div className="card" style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: 'var(--fg-muted)' }}>
            <Icon name="search" size={20} style={{ marginBottom: 8 }}/>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Sin resultados</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Cambia los filtros para ver dispositivos.</div>
          </div>
        )}
      </div>
    </>
  );
}

function DeviceCard({ d, openMenu, setOpenMenu, onConnect, onDelete }) {
  const isOnline = d.status === 'online';
  const menuOpen = openMenu === d.id;
  return (
    <div className="card card-hover" style={{ padding: 16, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: isOnline ? 'var(--accent-50)' : 'var(--surface-2)',
          color: isOnline ? 'var(--accent-700)' : 'var(--fg-muted)',
          display: 'grid', placeItems: 'center', flexShrink: 0,
          position: 'relative',
        }}>
          <Icon name="laptop" size={18}/>
          <span className={`status-dot ${isOnline ? 'ok' : 'err'}`} style={{ position: 'absolute', bottom: -2, right: -2, border: '2px solid var(--surface)', boxShadow: 'none' }}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.005em' }}>{d.name}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--fg-subtle)', marginTop: 2 }}>{d.rustdeskId}</div>
        </div>
        <button
          className="btn-ghost"
          style={{ padding: 4, borderRadius: 4, color: 'var(--fg-muted)' }}
          onClick={(e) => { e.stopPropagation(); setOpenMenu(menuOpen ? null : d.id); }}
        >
          <Icon name="moreH" size={16}/>
        </button>
        {menuOpen && (
          <>
            <div onClick={() => setOpenMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 5 }}/>
            <div className="card" style={{
              position: 'absolute', top: 36, right: 12, zIndex: 10,
              minWidth: 200, padding: 4, boxShadow: 'var(--shadow-lg)',
            }}>
              {[
                { icon: 'monitor',  label: 'Conectar (Pantalla)', action: () => { setOpenMenu(null); onConnect(); } },
                null,
                { icon: 'trash',    label: 'Eliminar', tone: 'err', action: () => { setOpenMenu(null); onDelete(); } },
              ].map((it, i) => it === null ? <div key={i} className="hr" style={{ margin: '4px 0' }}/> : (
                <button key={i} className="nav-item" onClick={it.action} style={{ padding: '7px 10px', fontSize: 12, color: it.tone === 'err' ? 'var(--err)' : 'var(--fg-muted)' }}>
                  <Icon name={it.icon} size={13}/>
                  {it.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 10px', fontSize: 11 }}>
        <span style={{ color: 'var(--fg-subtle)' }}>IP local</span>
        <span className="mono" style={{ color: 'var(--fg)', textAlign: 'right' }}>{d.ip}</span>
        <span style={{ color: 'var(--fg-subtle)' }}>Cliente</span>
        <span className="mono" style={{ color: 'var(--fg)', textAlign: 'right' }}>v{d.version}</span>
        <span style={{ color: 'var(--fg-subtle)' }}>Heartbeat</span>
        <span style={{ color: isOnline ? 'var(--ok)' : 'var(--err)', textAlign: 'right', fontWeight: 500 }}>{d.lastSeen}</span>
      </div>

      <button
        onClick={onConnect}
        className="btn btn-primary"
        style={{ marginTop: 14, width: '100%', justifyContent: 'center', height: 36, opacity: isOnline ? 1 : 0.5, pointerEvents: isOnline ? 'auto' : 'none' }}
      >
        <Icon name="zap" size={13}/> Conectar vía DPS DESK
      </button>
    </div>
  );
}

window.NetworkScreen = NetworkScreen;
