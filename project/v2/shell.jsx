/* global React */
const { useState } = React;

// Sidebar — icon + label nav with system status footer
function Sidebar({ active, onNavigate, onLogout, onOpenRecent }) {
  const items = [
    { id: 'dashboard', label: 'Dashboard',     icon: 'dashboard' },
    { id: 'network',   label: 'Empresas',      icon: 'store' },
    { id: 'config',    label: 'Configuración', icon: 'settings' },
  ];

  // API key health for DPS Desk. In the prototype the relay shared-secret is
  // pre-seeded in config, so we report active. Override at runtime with:
  //   localStorage.setItem('DPSDESK_API_INACTIVE', '1')
  const apiActive = typeof window === 'undefined'
    ? true
    : localStorage.getItem('DPSDESK_API_INACTIVE') !== '1';

  return (
    <aside style={{
      width: 250, flexShrink: 0,
      background: 'var(--paper-up)',
      borderRight: '1px solid var(--line)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Brand */}
      <div style={{ padding: '22px 18px 18px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BrandMark size={40}/>
          <div style={{ lineHeight: 1.05 }}>
            <div className="display" style={{ fontSize: 20 }}>DPS Desk</div>
            <div className="serial" style={{ fontSize: 9, marginTop: 3 }}>DIGITAL PHARMA SOLUTIONS</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 12px' }}>
        {items.map(it => (
          <button
            key={it.id}
            className="nav-item"
            data-active={active === it.id}
            onClick={() => onNavigate(it.id)}
          >
            <span className="nav-icon"><Icon name={it.icon} size={20}/></span>
            <span>{it.label}</span>
            {active === it.id && <span style={{ marginLeft: 'auto', color: 'var(--lime)' }}>●</span>}
          </button>
        ))}

        <div className="eyebrow" style={{ padding: '18px 8px 6px', fontSize: 10 }}>Sesión</div>
        <button className="nav-item" onClick={onOpenRecent}>
          <span className="nav-icon"><Icon name="refresh" size={20}/></span>
          <span>Recientes</span>
        </button>

        {/* System status card — right below the nav items */}
        <div className="card" style={{ padding: 14, marginTop: 18 }}>
          <div className="serial" style={{ fontSize: 10, marginBottom: 10 }}>SISTEMA</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)' }}>Versión:</span>
            <span className="mono" style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 600 }}>1.0.0</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)' }}>Estado:</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span className={'dot ' + (apiActive ? 'ok live' : 'bad')} style={{ color: apiActive ? 'var(--good)' : 'var(--bad)' }}/>
              <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: apiActive ? 'var(--good)' : 'var(--bad)' }}>
                {apiActive ? 'Activo' : 'Sin API key'}
              </span>
            </span>
          </div>
        </div>
        <button
          className="btn-ghost"
          style={{ marginTop: 10, width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', fontSize: 11, color: 'var(--ink-mute)' }}
          onClick={onLogout}
          title="Cerrar sesión"
        >
          <Icon name="logout" size={12}/>
          <span>Cerrar sesión</span>
        </button>
      </nav>
    </aside>
  );
}

// TopNav — minimal, editorial title style
function TopNav({ section, num, title, kicker, dark, onToggleDark, actions, user, onProfile, onPreferences, onSecurity, onHelp, onLogout }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [notifs, setNotifs] = useState([
    { id: 'n1', kind: 'alert',  title: 'POS-CAJA-3 sin conexión',         desc: 'Farmacia ESPOZ · La Estrella · hace 12 min', when: '12m', read: false },
    { id: 'n2', kind: 'alert',  title: 'Latencia alta en Neptuno',          desc: 'Farmacia ESPOZ · 240 ms sostenidos · 5 min', when: '38m', read: false },
    { id: 'n3', kind: 'info',   title: 'Carla Martínez aceptó la invitación', desc: 'Configuración · Equipo',                     when: '1 h', read: false },
    { id: 'n4', kind: 'ok',     title: 'Backup nocturno completado',        desc: 'Auditoría · 4 GB en 12 min',                  when: '3 h', read: true  },
    { id: 'n5', kind: 'info',   title: 'Nueva versión 1.2.17 disponible',   desc: 'POS · 14 dispositivos pendientes',           when: 'ayer', read: true  },
  ]);
  const unread = notifs.filter(n => !n.read).length;

  const markAllRead = () => setNotifs(ns => ns.map(n => ({ ...n, read: true })));
  const openNotif = () => {
    setUserOpen(false);
    setNotifOpen(o => {
      if (!o) markAllRead();
      return !o;
    });
  };
  const openUser = () => {
    setNotifOpen(false);
    setUserOpen(o => !o);
  };

  const u = user || { name: 'Sebastián Gómez', email: 'admin@digitalpharma.cl', initials: 'SG' };

  return (
    <header style={{
      display: 'flex', alignItems: 'flex-end', gap: 16,
      padding: '20px 28px 18px',
      borderBottom: '1px solid var(--line)',
      background: 'var(--paper-up)',
    }}>
      <div style={{ flex: 1 }}>
        {(num || section) && (
          <div className="marker" style={{ marginBottom: 8 }}>
            <span>{num}{num && section ? ' / ' : ''}{section}</span>
          </div>
        )}
        <h1 className="display" style={{ margin: 0, fontSize: 36, lineHeight: 0.95 }}>{title}</h1>
        {kicker && <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 8 }}>{kicker}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {actions}
        <div style={{ position: 'relative' }}>
          <button className="header-icon-btn" onClick={openNotif} aria-label="Notificaciones">
            <Icon name="bell" size={18}/>
            {unread > 0 && <span className="bell-badge">{unread > 9 ? '9+' : unread}</span>}
          </button>
          {notifOpen && (
            <>
              <div onClick={() => setNotifOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }}/>
              <NotifPanel notifs={notifs} onClose={() => setNotifOpen(false)} onClear={() => setNotifs([])}/>
            </>
          )}
        </div>
        <button className="header-icon-btn" onClick={onToggleDark} aria-label="Cambiar tema">
          <Icon name={dark ? 'sun' : 'moon'} size={18}/>
        </button>
        <div style={{ position: 'relative' }}>
          <button className="user-chip" onClick={openUser} aria-label="Cuenta">
            <span className="user-avatar">{u.initials}</span>
            <span className="user-meta">
              <span className="user-name">{u.name}</span>
              <span className="user-email">{u.email}</span>
            </span>
            <Icon name="chevronD" size={12}/>
          </button>
          {userOpen && (
            <>
              <div onClick={() => setUserOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }}/>
              <UserMenu
                user={u}
                onClose={() => setUserOpen(false)}
                onProfile={onProfile}
                onPreferences={onPreferences}
                onSecurity={onSecurity}
                onHelp={onHelp}
                onLogout={onLogout}
              />
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function UserMenu({ user, onClose, onProfile, onPreferences, onSecurity, onHelp, onLogout }) {
  const wrap = (fn) => () => { onClose(); fn && fn(); };
  return (
    <div className="user-menu">
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{user.name}</div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2 }}>{user.email}</div>
        <div className="mono" style={{ fontSize: 9, color: 'var(--ink-soft)', marginTop: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Administrador · Sesión activa</div>
      </div>
      <div style={{ padding: 6 }}>
        <button className="user-menu-item" onClick={wrap(onProfile)}><Icon name="user" size={14}/> Mi perfil</button>
        <button className="user-menu-item" onClick={wrap(onPreferences)}><Icon name="settings" size={14}/> Preferencias</button>
        <button className="user-menu-item" onClick={wrap(onHelp)}><Icon name="info" size={14}/> Ayuda y soporte</button>
      </div>
      <div style={{ padding: 6, borderTop: '1px solid var(--line)' }}>
        <button className="user-menu-item danger" onClick={wrap(onLogout)}><Icon name="logout" size={14}/> Cerrar sesión</button>
      </div>
    </div>
  );
}

function NotifPanel({ notifs, onClose, onClear }) {
  return (
    <div className="notif-panel">
      <div className="notif-head">
        <div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 700 }}>Notificaciones</div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', marginTop: 2, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {notifs.length} {notifs.length === 1 ? 'evento' : 'eventos'}
          </div>
        </div>
        {notifs.length > 0 && (
          <button onClick={onClear} className="mono" style={{ background: 'transparent', border: 'none', color: 'var(--ink-mute)', fontSize: 10, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Limpiar
          </button>
        )}
      </div>
      <div className="notif-body">
        {notifs.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ink-mute)' }}>
            <Icon name="check" size={28}/>
            <div style={{ fontSize: 13, marginTop: 12 }}>Estás al día</div>
            <div className="mono" style={{ fontSize: 10, marginTop: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Sin notificaciones</div>
          </div>
        ) : notifs.map(n => (
          <div key={n.id} className="notif-row">
            <span className={'notif-dot ' + n.kind}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{n.title}</div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', marginTop: 3 }}>{n.desc}</div>
            </div>
            <span className="mono" style={{ fontSize: 10, color: 'var(--ink-soft)', flexShrink: 0 }}>{n.when}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

window.Sidebar = Sidebar;
window.TopNav = TopNav;
