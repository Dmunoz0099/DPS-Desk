import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../components/PageHero.jsx';
import StatsBar from '../components/StatsBar.jsx';
import Icon from '../components/Icon.jsx';
import { api } from '../services/api.js';

export default function Monitoreo() {
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getResumen().then(setResumen).catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <PageHero
        title="Monitoreo en Tiempo Real"
        subtitle="Vista de estado general de todos los dispositivos POS"
        badge="Sistema monitoreando"
      />

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-500/10 dark:border-rose-500/30 p-3 text-sm text-rose-700 dark:text-rose-300">
          No se pudo cargar el monitoreo: {error}
        </div>
      )}

      {resumen && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Empresas', value: resumen.totales.empresas, icon: 'bag' },
              { label: 'Locales', value: resumen.totales.locales, icon: 'pin' },
              { label: 'Total POS', value: resumen.totales.pos, icon: 'monitor' },
              { label: 'Online', value: resumen.totales.online, accent: 'text-emerald-600' },
              { label: 'Offline', value: resumen.totales.offline, accent: 'text-rose-600' },
            ].map((c) => (
              <div key={c.label} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                {c.icon && <Icon name={c.icon} className="w-5 h-5 text-slate-400 dark:text-slate-500 mb-2" />}
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

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">Empresas</h2>
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Total de empresas registradas en el sistema
              </div>
              <div className="space-y-2">
                {resumen.empresas.slice(0, 5).map((e) => (
                  <div key={e.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{e.nombre}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {e.online} / {e.online + e.offline}
                    </span>
                  </div>
                ))}
              </div>
              {resumen.empresas.length > 5 && (
                <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  y {resumen.empresas.length - 5} más...
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">Control de Dispositivos</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Accede a DPSDESK para seleccionar un dispositivo y controlar de forma remota
              </p>
              <Link
                to="/dpsdesk"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium"
              >
                <Icon name="monitor" className="w-4 h-4" />
                Ir a DPSDESK
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
