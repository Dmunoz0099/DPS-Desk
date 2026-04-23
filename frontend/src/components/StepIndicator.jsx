// Indicador "1 Empresa — 2 Local — 3 POS"
export default function StepIndicator({ steps, current }) {
  return (
    <div className="flex items-center justify-center gap-3 my-6">
      {steps.map((label, i) => {
        const idx = i + 1;
        const active = idx === current;
        const done = idx < current;
        return (
          <div key={label} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={[
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border transition-colors',
                  done
                    ? 'bg-brand-600 text-white border-brand-600'
                    : active
                    ? 'bg-brand-600 text-white border-brand-600 ring-4 ring-brand-100 dark:ring-brand-600/20'
                    : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-300 dark:border-slate-700',
                ].join(' ')}
              >
                {idx}
              </div>
              <span
                className={[
                  'text-sm',
                  active
                    ? 'text-slate-900 dark:text-white font-medium'
                    : done
                    ? 'text-brand-600 dark:text-brand-300'
                    : 'text-slate-500 dark:text-slate-400',
                ].join(' ')}
              >
                {label}
              </span>
            </div>
            {idx < steps.length && (
              <div
                className={[
                  'w-12 h-0.5 rounded',
                  done ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-700',
                ].join(' ')}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
