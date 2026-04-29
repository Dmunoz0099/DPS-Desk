/* global React */
const { useState } = React;

// ---- Sidebar (shared across screens once logged in) ----
function Sidebar({ active, onNavigate, collapsed, onToggleCollapse }) {
  const items = [
    { id: 'dashboard', label: 'Panel',         icon: 'dashboard' },
    { id: 'network',   label: 'Empresas',      icon: 'network' },
    { id: 'config',    label: 'Configuración', icon: 'settings' },
  ];
  return (
    <aside style={{
      width: collapsed ? 64 : 240,
      flexShrink: 0,
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      transition: 'width 200ms ease',
    }}>
      {/* Brand */}
      <div style={{ padding: '20px 16px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: 'linear-gradient(135deg, var(--accent-500), var(--accent-700))',
          display: 'grid', placeItems: 'center', color: '#fff',
          boxShadow: '0 4px 12px -2px color-mix(in oklab, var(--accent-600) 40%, transparent)',
          flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12h4l3-9 4 18 3-9h4"/>
          </svg>
        </div>
        {!collapsed && (
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>DPS DESK</div>
            <div style={{ fontSize: 11, color: 'var(--fg-subtle)', marginTop: 2 }}>Operations</div>
          </div>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div style={{ padding: '0 12px 8px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 10px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 13,
            color: 'var(--fg-subtle)',
            cursor: 'text',
          }}>
            <Icon name="search" size={14}/>
            <span style={{ flex: 1 }}>Buscar dispositivo…</span>
            <kbd>⌘K</kbd>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ padding: '8px 12px', flex: 1 }}>
        {!collapsed && (
          <div className="label-meta" style={{ padding: '12px 8px 6px', fontSize: 10 }}>Navegación</div>
        )}
        {items.map(it => (
          <button
            key={it.id}
            className="nav-item"
            data-active={active === it.id}
            onClick={() => onNavigate(it.id)}
            title={collapsed ? it.label : ''}
            style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '10px' : undefined }}
          >
            <Icon name={it.icon} size={16}/>
            {!collapsed && <span>{it.label}</span>}
          </button>
        ))}

        {!collapsed && (
          <>
            <div className="label-meta" style={{ padding: '20px 8px 6px', fontSize: 10 }}>Atajos</div>
            <button className="nav-item">
              <Icon name="zap" size={16}/>
              <span>Conexión rápida</span>
              <kbd style={{ marginLeft: 'auto' }}>⌘J</kbd>
            </button>
            <button className="nav-item">
              <Icon name="history" size={16}/>
              <span>Sesiones recientes</span>
            </button>
          </>
        )}
      </nav>

      {/* Footer / status */}
      <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
        {!collapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="status-dot ok"/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500 }}>Relay operativo</div>
              <div style={{ fontSize: 11, color: 'var(--fg-subtle)' }}>v3.4.2 · región us-east</div>
            </div>
            <button className="btn-ghost" onClick={onToggleCollapse} style={{ padding: 4, borderRadius: 6 }}>
              <Icon name="chevronL" size={14}/>
            </button>
          </div>
        ) : (
          <button className="btn-ghost" onClick={onToggleCollapse} style={{ width: '100%', padding: 8, display: 'grid', placeItems: 'center', borderRadius: 6 }}>
            <Icon name="chevronR" size={14}/>
          </button>
        )}
      </div>
    </aside>
  );
}

// ---- TopNav ----
function TopNav({ title, subtitle, actions, dark, onToggleDark, onLogout, canGoBack, canGoForward, onGoBack, onGoForward }) {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '14px 28px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--surface)',
      minHeight: 60,
    }}>
      {/* Back / Forward */}
      <div style={{ display: 'flex', gap: 2, marginRight: 4 }}>
        <button
          className="btn btn-ghost"
          style={{ height: 30, width: 30, padding: 0, justifyContent: 'center', opacity: canGoBack ? 1 : 0.35 }}
          onClick={onGoBack}
          disabled={!canGoBack}
          title="Atrás"
        >
          <Icon name="chevronL" size={14}/>
        </button>
        <button
          className="btn btn-ghost"
          style={{ height: 30, width: 30, padding: 0, justifyContent: 'center', opacity: canGoForward ? 1 : 0.35 }}
          onClick={onGoForward}
          disabled={!canGoForward}
          title="Adelante"
        >
          <Icon name="chevronR" size={14}/>
        </button>
      </div>
      <div style={{ flex: 1 }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-0.015em' }}>{title}</h1>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {actions}
        <button className="btn btn-ghost" style={{ height: 32, width: 32, padding: 0, justifyContent: 'center' }} onClick={onToggleDark} title={dark ? 'Modo claro' : 'Modo oscuro'}>
          <Icon name={dark ? 'sun' : 'moon'} size={15}/>
        </button>
        <button className="btn btn-ghost" style={{ height: 32, width: 32, padding: 0, justifyContent: 'center', position: 'relative' }} title="Notificaciones">
          <Icon name="bell" size={15}/>
          <span className="badge-dot"/>
        </button>
        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 6px' }}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px 4px 4px', borderRadius: 'var(--radius-sm)' }}>
          <span className="avatar">DM</span>
          <div style={{ lineHeight: 1.15 }}>
            <div style={{ fontSize: 12, fontWeight: 500 }}>Diego M.</div>
            <div style={{ fontSize: 10, color: 'var(--fg-subtle)' }}>Admin · DPS</div>
          </div>
          <button className="btn btn-ghost" style={{ height: 28, width: 28, padding: 0, justifyContent: 'center', marginLeft: 4 }} onClick={onLogout} title="Cerrar sesión">
            <Icon name="logout" size={14}/>
          </button>
        </div>
      </div>
    </header>
  );
}

window.Sidebar = Sidebar;
window.TopNav = TopNav;
