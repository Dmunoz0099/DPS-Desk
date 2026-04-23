import Icon from './Icon.jsx';

export default function Filters({
  search,
  onSearch,
  posSeleccionado,
  onPosChange,
  estado,
  onEstadoChange,
  onRefresh,
  estadoOptions,
  posOptions,
  onClear,
  filtroRapido,
  onFiltroRapido,
}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 mt-4">
      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-700 dark:text-slate-200">
        <Icon name="search" className="w-4 h-4 text-brand-500" />
        Filtros y Búsqueda
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-4">
          <label className="text-[11px] uppercase tracking-wider text-slate-400">Buscar POS</label>
          <div className="relative mt-1">
            <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Ej: POS-001"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>
        </div>

        <div className="md:col-span-4">
          <label className="text-[11px] uppercase tracking-wider text-slate-400">Dispositivo POS</label>
          <select
            value={posSeleccionado}
            onChange={(e) => onPosChange(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          >
            <option value="">Todos los POS</option>
            {posOptions.map((p) => (
              <option key={p.id} value={p.id}>
                POS {p.numero}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-[11px] uppercase tracking-wider text-slate-400">Estado</label>
          <select
            value={estado}
            onChange={(e) => onEstadoChange(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          >
            {estadoOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 flex items-end">
          <button
            type="button"
            onClick={onRefresh}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium"
          >
            <Icon name="refresh" className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          onClick={onClear}
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline-offset-2 hover:underline"
        >
          Limpiar todo
        </button>
        <span className="text-slate-300 dark:text-slate-600">|</span>
        <span className="text-slate-500 dark:text-slate-400">Filtros rápidos:</span>
        {[
          { key: 'online', label: 'Solo Online' },
          { key: 'offline', label: 'Solo Offline' },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => onFiltroRapido(f.key)}
            className={[
              'px-2.5 py-1 rounded-full border transition-colors',
              filtroRapido === f.key
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:border-slate-300 dark:hover:border-slate-700',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
