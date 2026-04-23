import { NavLink } from 'react-router-dom';
import Icon from './Icon.jsx';

const items = [
  { to: '/dpsdesk', label: 'DPSDESK', icon: 'remote' },
  { to: '/deploy', label: 'Deploy', icon: 'deploy', disabled: true },
  { to: '/services', label: 'Services', icon: 'services', disabled: true },
  { to: '/logs-monitor', label: 'Monitor de Logs', icon: 'logs', disabled: true },
  { to: '/logs', label: 'Logs', icon: 'logs', disabled: true },
  { to: '/configuracion', label: 'Configuración', icon: 'config', disabled: true },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:flex-col w-60 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="h-16 flex items-center gap-2 px-5 border-b border-slate-200 dark:border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center text-white font-bold">
          D
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900 dark:text-white">DPSDESK</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 -mt-0.5">DPS Monitoring</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                it.disabled
                  ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed pointer-events-none'
                  : isActive
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-600/20 dark:text-brand-100 font-medium'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
              ].join(' ')
            }
          >
            <Icon name={it.icon} className="w-4 h-4" />
            <span>{it.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-200 dark:border-slate-800 px-5 py-4 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="uppercase tracking-wider mb-2 text-slate-400 dark:text-slate-500">Sistema</div>
        <div className="flex justify-between"><span>Versión</span><span className="text-slate-700 dark:text-slate-200">1.0.0</span></div>
        <div className="flex justify-between mt-1">
          <span>Estado</span>
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Activo
          </span>
        </div>
      </div>
    </aside>
  );
}
