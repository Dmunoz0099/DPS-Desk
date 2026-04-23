import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';

function Row({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <Icon name={icon} className="w-4 h-4" />
        {label}
      </span>
      <span className="font-medium text-slate-700 dark:text-slate-200 truncate max-w-[55%] text-right">
        {value}
      </span>
    </div>
  );
}

export default function PosCard({ pos }) {
  const [showHw, setShowHw] = useState(false);
  const navigate = useNavigate();
  const online = pos.estado === 'online';

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
          <Icon name="monitor" className="w-5 h-5" />
        </div>
        <button
          type="button"
          className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Más opciones"
        >
          <Icon name="ellipsis" className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-2 flex items-baseline justify-between">
        <div className="text-2xl font-bold text-slate-900 dark:text-white">{pos.numero}</div>
        <span
          className={[
            'inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full',
            online
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
              : 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
          ].join(' ')}
        >
          <span className={['w-1.5 h-1.5 rounded-full', online ? 'bg-emerald-500' : 'bg-rose-500'].join(' ')} />
          {online ? 'Conectado' : 'Desconectado'}
        </span>
      </div>

      <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
        <Row icon="bag" label="Empresa" value={pos.empresaNombre} />
        <Row icon="pin" label="Local" value={pos.localNombre} />
        <Row icon="ip" label="IP" value={pos.ip} />
        <Row icon="version" label="Versión" value={pos.version} />
      </div>

      <button
        type="button"
        onClick={() => setShowHw((v) => !v)}
        className="mt-3 w-full flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
      >
        <span className="inline-flex items-center gap-2">
          <Icon name="hardware" className="w-4 h-4" />
          Información de Hardware
        </span>
        <span className={['transition-transform', showHw ? 'rotate-180' : ''].join(' ')}>
          <Icon name="back" className="w-3 h-3 -rotate-90" />
        </span>
      </button>
      {showHw && (
        <div className="mt-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3 text-xs text-slate-600 dark:text-slate-300 space-y-1">
          <div><span className="text-slate-400">CPU:</span> {pos.hardware.cpu}</div>
          <div><span className="text-slate-400">RAM:</span> {pos.hardware.ram}</div>
          <div><span className="text-slate-400">Disco:</span> {pos.hardware.disco}</div>
          <div><span className="text-slate-400">SO:</span> {pos.hardware.os}</div>
        </div>
      )}

      <div className="mt-3 text-xs text-slate-400 dark:text-slate-500 inline-flex items-center gap-1">
        <Icon name="version" className="w-3.5 h-3.5" />
        Última actividad: hace {pos.ultimaActividadMin} minutos
      </div>

      <button
        type="button"
        onClick={() => navigate(`/remote/${pos.id}`)}
        disabled={!online}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
      >
        <Icon name="remote" className="w-4 h-4" />
        Control Remoto
      </button>
    </div>
  );
}
