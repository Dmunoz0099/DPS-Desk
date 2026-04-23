import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../components/PageHero.jsx';
import StatsBar from '../components/StatsBar.jsx';
import Icon from '../components/Icon.jsx';
import { api } from '../services/api.js';

export default function Dashboard() {
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getResumen().then(setResumen).catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <PageHero
        title="Dashboard"
        subtitle="Resumen general del sistema DPSDESK"
        badge="API conectada"
      />

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-500/10 dark:border-rose-500/30 p-3 text-sm text-rose-700 dark:text-rose-300">
          No se pudo cargar el resumen: {error}
        </div>
      )}

      {resumen && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Empresas', value: resumen.totales.empresas },
              { label: 'Locales', value: resumen.totales.locales },
              { label: 'POS Online', value: resumen.totales.online, accent: 'text-emerald-600' },
              { label: 'POS Offline', value: resumen.totales.offline, accent: 'text-rose-600' },
            ].map((c) => (
              <div key={c.label} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                <div className="text-xs uppercase text-slate-400 tracking-wider">{c.label}</div>
                <div className={['mt-2 text-2xl font-bold text-slate-800 dark:text-slate-100', c.accent || ''].join(' ')}>
                  {c.value}
                </div>
              </div>
            ))}
          </div>

          <StatsBar
            total={resumen.totales.pos}
            online={resumen.totales.online}
            offline={resumen.totales.offline}
          />

          <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-800 dark:text-slate-100">Comenzar monitoreo</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Selecciona empresa, local y POS para tomar control remoto.
                </p>
              </div>
              <Link
                to="/monitoreo"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium"
              >
                <Icon name="monitor" className="w-4 h-4" />
                Ir a Monitoreo
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
