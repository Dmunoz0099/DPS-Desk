import Icon from './Icon.jsx';

export default function LocalCard({ local, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-rose-400 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-500/15 text-rose-500 flex items-center justify-center">
          <Icon name="pin" className="w-5 h-5" />
        </div>
        <span className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-rose-500">
          Local
        </span>
      </div>
      <div className="mt-4 font-semibold text-slate-900 dark:text-white truncate">{local.nombre}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400">{local.codigo}</div>
      <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          {local.online} online
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          {local.offline} offline
        </span>
      </div>
    </button>
  );
}
