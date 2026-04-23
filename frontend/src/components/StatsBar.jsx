// Barra de stats Total / Online / Offline (con porcentajes)
export default function StatsBar({ total, online, offline }) {
  const pctOn = total > 0 ? Math.round((online / total) * 100) : 0;
  const pctOff = total > 0 ? Math.round((offline / total) * 100) : 0;

  const cards = [
    {
      label: 'Total',
      value: total,
      pct: '',
      tone: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
      bar: 'bg-slate-400',
    },
    {
      label: 'Online',
      value: online,
      pct: `${pctOn}%`,
      tone: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
      bar: 'bg-emerald-500',
    },
    {
      label: 'Offline',
      value: offline,
      pct: `${pctOff}%`,
      tone: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300',
      bar: 'bg-rose-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={['w-10 h-10 rounded-lg flex items-center justify-center', c.tone].join(' ')}>
                <span className="text-base font-bold">{c.value}</span>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">{c.label}</div>
                <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">{c.value}</div>
              </div>
            </div>
            {c.pct && (
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{c.pct}</span>
            )}
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={['h-full', c.bar].join(' ')}
              style={{ width: c.label === 'Total' ? '100%' : c.pct }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
