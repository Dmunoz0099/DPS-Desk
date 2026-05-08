/* global React */
const { useState, useEffect } = React;

function NetworkScreen({ onConnect, initialCompany, onRefresh }) {
  const COMPANIES_FULL = window.MOCK?.COMPANIES_FULL || [];
  const hasData = COMPANIES_FULL.length > 0;

  const startCompany = (initialCompany && COMPANIES_FULL.find(c => c.id === initialCompany))
    ? initialCompany
    : (hasData ? COMPANIES_FULL[0].id : null);
  const startLocation = startCompany
    ? (COMPANIES_FULL.find(c => c.id === startCompany)?.locations[0]?.id || null)
    : null;

  const [selectedCompany, setSelectedCompany] = useState(startCompany);
  const [selectedLocation, setSelectedLocation] = useState(startLocation);
  const [addModal, setAddModal] = useState(null); // null | 'company' | 'location' | 'device'
  const [deleteTarget, setDeleteTarget] = useState(null); // null | { kind: 'company'|'location', name, id, counts }
  const [renameTarget, setRenameTarget] = useState(null); // null | { kind, id, currentValue }
  const [deviceFilter, setDeviceFilter] = useState('');
  const [busy, setBusy] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  // Cuando llega data fresca y la selección actual ya no existe, reapuntar al primero.
  useEffect(() => {
    if (!hasData) return;
    if (!COMPANIES_FULL.find(c => c.id === selectedCompany)) {
      const first = COMPANIES_FULL[0];
      setSelectedCompany(first.id);
      setSelectedLocation(first.locations[0]?.id || null);
      return;
    }
    const co = COMPANIES_FULL.find(c => c.id === selectedCompany);
    if (co && !co.locations.find(l => l.id === selectedLocation)) {
      setSelectedLocation(co.locations[0]?.id || null);
    }
  }, [COMPANIES_FULL, hasData, selectedCompany, selectedLocation]);

  // Mapas auxiliares para traducir IDs jerárquicos → IDs reales del backend.
  const empresaIdByName = {};
  (window.MOCK?.COMPANIES || []).forEach((c) => { empresaIdByName[c.name] = c.idSucursal; });
  const localIdByCoCod = {};
  (window.MOCK?.LOCALES || []).forEach((l) => { localIdByCoCod[l.company + '|' + l.cod] = l._id || l.cod; });

  const handleCreateCompany = async (vals) => {
    setBusy(true); setErrMsg('');
    try {
      await window.API.createEmpresa({ id: vals.cod, nombre: vals.name });
      await onRefresh?.();
      setAddModal(null);
    } catch (err) { setErrMsg(err.message || 'No se pudo crear empresa'); }
    finally { setBusy(false); }
  };
  const handleCreateLocation = async (vals) => {
    setBusy(true); setErrMsg('');
    try {
      const empresaId = empresaIdByName[selectedCompany];
      await window.API.createLocal({ id: vals.cod, empresa_id: empresaId, nombre: vals.name });
      await onRefresh?.();
      setAddModal(null);
    } catch (err) { setErrMsg(err.message || 'No se pudo crear local'); }
    finally { setBusy(false); }
  };
  const handleCreateDevice = async (vals) => {
    setBusy(true); setErrMsg('');
    try {
      const cod = location?.id?.split('-').slice(1).join('-') || '';
      const localId = localIdByCoCod[selectedCompany + '|' + cod];
      const empresaId = empresaIdByName[selectedCompany];
      const numero = parseInt(vals.numero, 10);
      if (!Number.isFinite(numero)) {
        setErrMsg('Número de POS inválido');
        setBusy(false);
        return;
      }
      await window.API.createPos({
        id: vals.rustdesk,
        local_id: localId,
        empresa_id: empresaId,
        numero,
      });
      await onRefresh?.();
      setAddModal(null);
    } catch (err) { setErrMsg(err.message || 'No se pudo crear POS'); }
    finally { setBusy(false); }
  };
  const handleDeleteDevice = async (devId) => {
    try {
      await window.API.deletePos(devId);
      await onRefresh?.();
    } catch (err) { console.error('[Network] delete POS:', err); setErrMsg(err.message || 'No se pudo eliminar'); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true); setErrMsg('');
    try {
      if (deleteTarget.kind === 'company') {
        await window.API.deleteEmpresa(deleteTarget.id);
      } else if (deleteTarget.kind === 'location') {
        await window.API.deleteLocal(deleteTarget.id);
      }
      await onRefresh?.();
      setDeleteTarget(null);
    } catch (err) {
      setErrMsg(err.message || 'No se pudo eliminar');
    } finally {
      setBusy(false);
    }
  };

  const confirmRename = async (newValue) => {
    if (!renameTarget) return;
    setBusy(true); setErrMsg('');
    try {
      if (renameTarget.kind === 'company') {
        await window.API.updateEmpresa(renameTarget.id, { nombre: newValue });
      } else if (renameTarget.kind === 'location') {
        await window.API.updateLocal(renameTarget.id, { nombre: newValue });
      } else if (renameTarget.kind === 'device') {
        const num = parseInt(newValue, 10);
        if (!Number.isFinite(num)) throw new Error('Número de POS inválido');
        await window.API.updatePos(renameTarget.id, { numero: num });
      }
      await onRefresh?.();
      setRenameTarget(null);
    } catch (err) {
      setErrMsg(err.message || 'No se pudo renombrar');
    } finally {
      setBusy(false);
    }
  };

  if (!hasData) {
    return (
      <div className="fade-in" style={{ padding: 60, display: 'grid', placeItems: 'center', minHeight: 'calc(100vh - 160px)' }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div className="display" style={{ fontSize: 28, marginBottom: 10 }}>
            Sin <span className="italic-d">empresas</span> registradas
          </div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)', letterSpacing: '0.04em', marginBottom: 20 }}>
            Crea la primera para empezar a registrar locales y POS.
          </div>
          <button className="btn btn-acid" onClick={() => setAddModal('company')}>
            <Icon name="plus" size={13}/> Nueva empresa
          </button>
        </div>
        {addModal === 'company' && (
          <AddModal kind="company" company={null} location={null} companies={COMPANIES_FULL}
            busy={busy} errMsg={errMsg}
            onClose={() => { setAddModal(null); setErrMsg(''); }}
            onSubmit={handleCreateCompany}/>
        )}
      </div>
    );
  }

  const company = COMPANIES_FULL.find(c => c.id === selectedCompany);
  const location = company?.locations.find(l => l.id === selectedLocation) || company?.locations[0];

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
          const totalPos = c.totalPos;
          const localCount = c.locations.length;
          const realId = empresaIdByName[c.name];
          return (
            <RowWithMenu
              key={c.id}
              active={active}
              onClick={() => { setSelectedCompany(c.id); setSelectedLocation(c.locations[0]?.id || null); }}
              onRename={() => setRenameTarget({ kind: 'company', id: realId, currentValue: c.name })}
              onDelete={() => setDeleteTarget({
                kind: 'company',
                name: c.name,
                id: realId,
                counts: { locales: localCount, pos: totalPos },
              })}
            >
              <div className="serial" style={{ fontSize: 9 }}>EMP-{String(i+1).padStart(2,'0')}</div>
              <div style={{ fontSize: 13, fontWeight: 500, marginTop: 4, paddingRight: 22 }}>{c.name}</div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 6, display: 'flex', gap: 10 }}>
                <span>{localCount} locales</span>
                <span>·</span>
                <span>{totalPos} POS</span>
                {c.offline > 0 && <span style={{ color: 'var(--bad)', marginLeft: 'auto' }}>● {c.offline}</span>}
              </div>
            </RowWithMenu>
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
            const cod = l.id.split('-').slice(1).join('-');
            const realId = localIdByCoCod[selectedCompany + '|' + cod];
            return (
              <RowWithMenu
                key={l.id}
                active={active}
                paddingY={12}
                onClick={() => setSelectedLocation(l.id)}
                onRename={() => setRenameTarget({ kind: 'location', id: realId, currentValue: l.name })}
                onDelete={() => setDeleteTarget({
                  kind: 'location',
                  name: l.name,
                  id: realId,
                  counts: { pos: l.total },
                })}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 22 }}>
                  <span className={`dot ${l.offline > 0 ? 'bad' : 'ok'}`}/>
                  <span style={{ fontSize: 12, fontWeight: 500, flex: 1 }}>{l.name}</span>
                  <span className="num mono" style={{ fontSize: 10, color: 'var(--ink-mute)' }}>{l.online}/{l.total}</span>
                </div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 4, paddingLeft: 14 }}>{l.address}</div>
              </RowWithMenu>
            );
          })}
          <button onClick={() => setAddModal('location')} className="add-row">
            <Icon name="plus" size={16}/>
            <span>Nuevo local en {company.name}</span>
          </button>
        </div>

        {/* Devices column */}
        <div style={{ padding: '24px 24px 40px' }}>
          {!location ? (
            <div style={{ display: 'grid', placeItems: 'center', minHeight: 360, textAlign: 'center' }}>
              <div style={{ maxWidth: 360 }}>
                <div className="display" style={{ fontSize: 24, marginBottom: 10 }}>
                  Sin <span className="italic-d">locales</span> en {company.name}
                </div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)', letterSpacing: '0.04em', marginBottom: 18 }}>
                  Crea el primero para empezar a registrar dispositivos.
                </div>
                <button className="btn btn-acid" onClick={() => setAddModal('location')}>
                  <Icon name="plus" size={13}/> Nuevo local
                </button>
              </div>
            </div>
          ) : (
            <>
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
                {(location.devices || [])
                  .filter(d => {
                    if (!deviceFilter.trim()) return true;
                    const q = deviceFilter.toLowerCase();
                    return (d.name || '').toLowerCase().includes(q)
                      || (d.id || '').toLowerCase().includes(q)
                      || (d.os || '').toLowerCase().includes(q)
                      || (d.rustdeskId || '').toLowerCase().includes(q);
                  })
                  .map(d => (
                    <DeviceCard
                      key={d.id}
                      d={d}
                      onConnect={onConnect}
                      onRename={() => setRenameTarget({
                        kind: 'device',
                        id: d.id,
                        currentValue: String(d.name || '').replace(/^POS-/, '') || '',
                      })}
                      onDelete={() => handleDeleteDevice(d.id)}
                    />
                  ))}
                <AddDeviceCard onClick={() => setAddModal('device')}/>
              </div>
            </>
          )}
        </div>
      </div>

      {addModal && (
        <AddModal
          kind={addModal}
          company={company}
          location={location}
          companies={COMPANIES_FULL}
          busy={busy}
          errMsg={errMsg}
          onClose={() => { setAddModal(null); setErrMsg(''); }}
          onSubmit={addModal === 'company' ? handleCreateCompany : addModal === 'location' ? handleCreateLocation : handleCreateDevice}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteEntityModal
          target={deleteTarget}
          busy={busy}
          errMsg={errMsg}
          onClose={() => { if (!busy) { setDeleteTarget(null); setErrMsg(''); } }}
          onConfirm={confirmDelete}
        />
      )}

      {renameTarget && (
        <RenameEntityModal
          target={renameTarget}
          busy={busy}
          errMsg={errMsg}
          onClose={() => { if (!busy) { setRenameTarget(null); setErrMsg(''); } }}
          onConfirm={confirmRename}
        />
      )}
    </div>
  );
}

// Fila clickeable de empresa/local con un menú kebab (•••) que ofrece "Eliminar".
// Se reusa para el listado de empresas y el de locales — ambos tienen el mismo patrón:
// click en el cuerpo selecciona, click en el kebab abre acciones.
function RowWithMenu({ active, onClick, onRename, onDelete, paddingY = 14, children }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <div style={{
      position: 'relative',
      borderTop: '1px solid var(--line)',
      background: active ? 'var(--paper-2)' : 'transparent',
      borderLeft: active ? '2px solid var(--plum)' : '2px solid transparent',
    }}>
      <button
        onClick={onClick}
        style={{
          width: '100%', textAlign: 'left',
          padding: `${paddingY}px 20px`,
          background: 'transparent', border: 'none',
          cursor: 'pointer', color: 'inherit',
        }}
      >
        {children}
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="btn-ghost"
        style={{
          position: 'absolute', top: 8, right: 8,
          padding: 4, width: 22, height: 22,
          display: 'grid', placeItems: 'center',
          color: 'var(--ink-soft)',
          borderRadius: 6,
        }}
        aria-label="Acciones"
      >
        <Icon name="dots" size={13}/>
      </button>
      {open && (
        <>
          <div onClick={close} style={{ position: 'fixed', inset: 0, zIndex: 40 }}/>
          <div className="device-menu" style={{ top: 32, right: 8, left: 'auto', transform: 'none', width: 180, animation: 'none' }}>
            {onRename && (
              <button className="device-menu-item" onClick={() => { close(); onRename(); }}>
                <Icon name="edit" size={12}/> Renombrar
              </button>
            )}
            {onRename && onDelete && <div className="device-menu-sep"/>}
            <button className="device-menu-item danger" onClick={() => { close(); onDelete && onDelete(); }}>
              <Icon name="trash" size={12}/> Eliminar
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function RenameEntityModal({ target, busy, errMsg, onClose, onConfirm }) {
  const isDevice = target.kind === 'device';
  const [value, setValue] = useState(target.currentValue || '');
  const titleWord = target.kind === 'company' ? 'empresa' : target.kind === 'location' ? 'local' : 'POS';
  const fieldLabel = isDevice ? 'Nuevo número de POS' : 'Nuevo nombre';
  const placeholder = isDevice ? 'Ej: 3' : 'Nombre…';

  const trimmed = String(value).trim();
  const ok = trimmed.length > 0 && trimmed !== String(target.currentValue || '').trim()
    && (!isDevice || Number.isFinite(parseInt(trimmed, 10)));

  const submit = (e) => {
    e?.preventDefault();
    if (!ok || busy) return;
    onConfirm(trimmed);
  };

  return (
    <div className="modal-overlay" onClick={busy ? undefined : onClose}>
      <div className="modal-shell modal-compact" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-head-compact">
          <div style={{ flex: 1 }}>
            <h3 style={{ fontFamily: 'var(--sans)', fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--ink)' }}>
              Renombrar {titleWord}
            </h3>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', marginTop: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Actual: {target.currentValue || '—'}
            </div>
          </div>
          <button onClick={onClose} className="btn-icon-close" disabled={busy}>
            <Icon name="x" size={14}/>
          </button>
        </div>
        <form onSubmit={submit} className="modal-body-compact">
          <div className="form-row-compact">
            <label className="form-label-compact">{fieldLabel}</label>
            <input
              autoFocus
              className={'input-compact' + (isDevice ? ' mono' : '')}
              type={isDevice ? 'number' : 'text'}
              placeholder={placeholder}
              value={value}
              onChange={e => setValue(e.target.value)}
              disabled={busy}
            />
          </div>

          {errMsg && (
            <div className="cfg-banner bad" role="alert">
              <Icon name="x" size={13}/>
              <span>{errMsg}</span>
            </div>
          )}

          <div className="modal-foot-compact">
            <button type="button" onClick={onClose} className="btn-cancel-compact" disabled={busy}>Cancelar</button>
            <button type="submit" className="btn-save-compact" disabled={!ok || busy}>
              {busy ? <span className="spinner"/> : <Icon name="check" size={13}/>}
              {busy ? ' Guardando…' : ' Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmDeleteEntityModal({ target, busy, errMsg, onClose, onConfirm }) {
  const isCompany = target.kind === 'company';
  const titleWord = isCompany ? 'empresa' : 'local';
  const description = isCompany
    ? <>Se eliminará la empresa <strong style={{ fontFamily: 'var(--mono)' }}>{target.name}</strong> junto con sus <strong>{target.counts?.locales || 0}</strong> locales y <strong>{target.counts?.pos || 0}</strong> POS asociados. Las sesiones activas se cortarán.</>
    : <>Se eliminará el local <strong style={{ fontFamily: 'var(--mono)' }}>{target.name}</strong> y sus <strong>{target.counts?.pos || 0}</strong> POS asociados. Las sesiones activas se cortarán.</>;

  return (
    <div className="modal-overlay" onClick={busy ? undefined : onClose}>
      <div className="modal-shell modal-compact" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-head-compact">
          <div style={{ flex: 1 }}>
            <h3 style={{ fontFamily: 'var(--sans)', fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--bad)' }}>
              Eliminar {titleWord}
            </h3>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', marginTop: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Esta acción no se puede deshacer.
            </div>
          </div>
          <button onClick={onClose} className="btn-icon-close" disabled={busy}>
            <Icon name="x" size={14}/>
          </button>
        </div>
        <div style={{ padding: 24 }}>
          <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink)', margin: 0 }}>
            {description}
          </p>

          {errMsg && (
            <div className="cfg-banner bad" role="alert" style={{ marginTop: 16 }}>
              <Icon name="x" size={13}/>
              <span>{errMsg}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--line)' }}>
            <button className="btn" onClick={onClose} disabled={busy}>Cancelar</button>
            <button
              className="btn"
              style={{ marginLeft: 'auto', background: 'var(--bad)', borderColor: 'var(--bad)', color: '#FFF' }}
              onClick={onConfirm}
              disabled={busy}
            >
              {busy ? <span className="spinner"/> : <Icon name="trash" size={12}/>}
              {busy ? ' Eliminando…' : ` Eliminar ${titleWord}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeviceCard({ d, onConnect, onRename, onDelete }) {
  const tone = d.status === 'online' ? 'good' : d.status === 'idle' ? 'warn' : 'bad';
  const label = d.status === 'online' ? 'CONECTADO' : d.status === 'idle' ? 'INACTIVO' : 'DESCONECTADO';
  const lastSeenLabel = d.lastSeen ? `Última actividad: ${d.lastSeen}` : 'Sin actividad reciente';
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const name = d.name;

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
            {onRename && (
              <button className="device-menu-item" onClick={() => { close(); onRename(); }}>
                <Icon name="edit" size={12}/> Renombrar (número)
              </button>
            )}
            <button className="device-menu-item danger" onClick={() => { close(); setConfirmDel(true); }}>
              <Icon name="trash" size={12}/> Eliminar dispositivo
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

function AddModal({ kind, company, location, companies, busy, errMsg, onClose, onSubmit }) {
  const config = {
    company: {
      title: 'Nueva empresa',
      subtitle: 'Ingresa los datos requeridos',
      icon: 'building',
      fields: [
        { id: 'name', label: 'Empresa', placeholder: 'Nombre de la empresa', type: 'text', required: true, autoFocus: true },
        { id: 'cod',  label: 'Sucursal de identificación', placeholder: 'Número de sucursal', type: 'text', mono: true, required: true },
      ],
    },
    location: {
      title: 'Nuevo local',
      subtitle: `Empresa: ${company?.name || ''}`,
      icon: 'store',
      fields: [
        { id: 'name', label: 'Nombre del local', placeholder: 'Ej: Santa Rosa', type: 'text', required: true, autoFocus: true },
        { id: 'cod',  label: 'Número de local / código', placeholder: 'Ej: 001', type: 'text', mono: true, required: true },
      ],
    },
    device: {
      title: 'Nuevo dispositivo',
      subtitle: `${company?.name || ''}${location ? ' · ' + location.name : ''}`,
      icon: 'monitor',
      fields: [
        { id: 'numero',   label: 'Número de POS', placeholder: 'Ej: 1', type: 'number', mono: true, required: true, autoFocus: true },
        { id: 'rustdesk', label: 'ID DPS Desk',   placeholder: '123 456 789', type: 'text', mono: true, required: true },
      ],
    },
  }[kind];

  const [values, setValues] = useState(() => Object.fromEntries(config.fields.map(f => [f.id, ''])));
  const setField = (id, v) => setValues(s => ({ ...s, [id]: v }));
  const canSubmit = config.fields.every(f => !f.required || (values[f.id] || '').trim().length > 0);

  const submit = (e) => {
    e?.preventDefault();
    if (!canSubmit || busy) return;
    onSubmit?.(values);
  };

  return (
    <div className="modal-overlay" onClick={busy ? undefined : onClose}>
      <div className="modal-shell modal-compact" onClick={e => e.stopPropagation()}>
        <div className="modal-head-compact">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontFamily: 'var(--sans)', fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--ink)' }}>
              {config.title}
            </h3>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', marginTop: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {config.subtitle}
            </div>
          </div>
          <button onClick={onClose} className="btn-icon-close" aria-label="Cerrar" disabled={busy}>
            <Icon name="x" size={14}/>
          </button>
        </div>

        <form className="modal-body-compact" onSubmit={submit}>
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
                value={values[f.id]}
                onChange={(e) => setField(f.id, e.target.value)}
                disabled={busy}
              />
            </div>
          ))}

          {errMsg && (
            <div className="cfg-banner bad" role="alert">
              <Icon name="x" size={13}/>
              <span>{errMsg}</span>
            </div>
          )}

          <div className="modal-foot-compact">
            <button type="button" onClick={onClose} className="btn-cancel-compact" disabled={busy}>Cancelar</button>
            <button type="submit" className="btn-save-compact" disabled={!canSubmit || busy}>
              {busy ? <span className="spinner"/> : <Icon name="check" size={13}/>}
              {busy ? ' Guardando…' : ' Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

window.NetworkScreen = NetworkScreen;
