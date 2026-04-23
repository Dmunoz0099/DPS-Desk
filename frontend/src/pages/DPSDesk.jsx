import { useEffect, useMemo, useState } from 'react';
import PageHero from '../components/PageHero.jsx';
import StepIndicator from '../components/StepIndicator.jsx';
import EmpresaCard from '../components/EmpresaCard.jsx';
import LocalCard from '../components/LocalCard.jsx';
import PosCard from '../components/PosCard.jsx';
import StatsBar from '../components/StatsBar.jsx';
import Filters from '../components/Filters.jsx';
import Icon from '../components/Icon.jsx';
import { api } from '../services/api.js';

const STEPS = ['Empresa', 'Local', 'POS'];

export default function DPSDesk() {
  const [step, setStep] = useState(1);
  const [empresas, setEmpresas] = useState([]);
  const [empresa, setEmpresa] = useState(null);
  const [locales, setLocales] = useState([]);
  const [local, setLocal] = useState(null);
  const [pos, setPos] = useState([]);
  const [totales, setTotales] = useState({ pos: 0 });

  // Filtros para vista de POS
  const [search, setSearch] = useState('');
  const [posSeleccionado, setPosSeleccionado] = useState('');
  const [estado, setEstado] = useState('todos');
  const [filtroRapido, setFiltroRapido] = useState(null);
  const [vista, setVista] = useState('grid');
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .getResumen()
      .then((r) => {
        setEmpresas(r.empresas);
        setTotales(r.totales);
      })
      .catch((e) => setError(e.message));
  }, []);

  function elegirEmpresa(e) {
    setEmpresa(e);
    setLocal(null);
    setPos([]);
    setStep(2);
    api.getLocales(e.id).then(setLocales).catch((err) => setError(err.message));
  }

  function elegirLocal(l) {
    setLocal(l);
    setStep(3);
    api.getPosPorLocal(l.id).then(setPos).catch((err) => setError(err.message));
  }

  function reiniciar() {
    setStep(1);
    setEmpresa(null);
    setLocal(null);
    setLocales([]);
    setPos([]);
    setSearch('');
    setPosSeleccionado('');
    setEstado('todos');
    setFiltroRapido(null);
  }

  function refrescar() {
    if (step === 3 && local) api.getPosPorLocal(local.id).then(setPos);
    else if (step === 2 && empresa) api.getLocales(empresa.id).then(setLocales);
    else api.getResumen().then((r) => setEmpresas(r.empresas));
  }

  const posFiltrados = useMemo(() => {
    return pos.filter((p) => {
      if (search && !`POS-${String(p.numero).padStart(3, '0')}`.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (posSeleccionado && p.id !== posSeleccionado) return false;
      const estadoFinal = filtroRapido || (estado !== 'todos' ? estado : null);
      if (estadoFinal && p.estado !== estadoFinal) return false;
      return true;
    });
  }, [pos, search, posSeleccionado, estado, filtroRapido]);

  const onlineCount = pos.filter((p) => p.estado === 'online').length;
  const offlineCount = pos.length - onlineCount;

  const heroBadge = step === 1 ? 'SSE: Conectado' : `${empresa?.nombre || ''}${local ? ' · ' + local.nombre : ''}`;
  const heroRight = (
    <div className="text-right">
      <div className="text-xs text-white/70 uppercase tracking-wider">Total dispositivos</div>
      <div className="text-2xl font-bold">{totales.pos}</div>
      <div className="text-[11px] inline-flex items-center gap-1 text-white/80">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>SSE Conectado
      </div>
    </div>
  );

  return (
    <div>
      <PageHero
        title="DPSDESK — Control de Dispositivos"
        subtitle="Selecciona empresa, local y POS para iniciar sesión de control remoto"
        badge={heroBadge}
        right={heroRight}
      />

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-500/10 dark:border-rose-500/30 p-3 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* STEP 1 — Empresas */}
      {step === 1 && (
        <section>
          <h2 className="text-center text-2xl font-bold text-slate-800 dark:text-slate-100">Seleccionar Ubicación</h2>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-1">
            Por favor selecciona la empresa y local para ver los dispositivos
          </p>
          <StepIndicator steps={STEPS} current={1} />

          <div className="max-w-3xl mx-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Selecciona una Empresa</h3>
            </div>
            <input
              placeholder="Buscar empresa..."
              onChange={(e) => {
                const q = e.target.value.toLowerCase();
                setEmpresas((prev) => prev.map((x) => ({ ...x, _hide: !x.nombre.toLowerCase().includes(q) })));
              }}
              className="w-full px-3 py-2 mb-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {empresas.filter((e) => !e._hide).map((e) => (
                <EmpresaCard key={e.id} empresa={e} onClick={() => elegirEmpresa(e)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* STEP 2 — Locales */}
      {step === 2 && empresa && (
        <section>
          <h2 className="text-center text-2xl font-bold text-slate-800 dark:text-slate-100">Seleccionar Ubicación</h2>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-1">
            Por favor selecciona la empresa y local para ver los dispositivos
          </p>
          <StepIndicator steps={STEPS} current={2} />

          <div className="max-w-3xl mx-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Selecciona un Local</h3>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Empresa: <span className="font-medium text-slate-700 dark:text-slate-200">{empresa.nombre}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={reiniciar}
                className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700"
              >
                <Icon name="back" className="w-3.5 h-3.5" />
                Cambiar empresa
              </button>
            </div>
            <input
              placeholder="Buscar local..."
              onChange={(e) => {
                const q = e.target.value.toLowerCase();
                setLocales((prev) => prev.map((x) => ({ ...x, _hide: !x.nombre.toLowerCase().includes(q) })));
              }}
              className="w-full px-3 py-2 mb-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {locales.filter((l) => !l._hide).map((l) => (
                <LocalCard key={l.id} local={l} onClick={() => elegirLocal(l)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* STEP 3 — POS */}
      {step === 3 && local && (
        <section>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-slate-700 dark:text-slate-200">{empresa.nombre}</span>
            <span className="text-slate-400">·</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">{local.nombre}</span>
            <button
              type="button"
              onClick={reiniciar}
              className="ml-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-brand-50 text-brand-700 dark:bg-brand-600/20 dark:text-brand-200 hover:bg-brand-100"
            >
              <Icon name="back" className="w-3.5 h-3.5" />
              Cambiar ubicación
            </button>
          </div>

          <Filters
            search={search}
            onSearch={setSearch}
            posSeleccionado={posSeleccionado}
            onPosChange={setPosSeleccionado}
            estado={estado}
            onEstadoChange={(v) => {
              setEstado(v);
              setFiltroRapido(null);
            }}
            onRefresh={refrescar}
            estadoOptions={[
              { value: 'todos', label: `Todos (${pos.length})` },
              { value: 'online', label: `Online (${onlineCount})` },
              { value: 'offline', label: `Offline (${offlineCount})` },
            ]}
            posOptions={pos}
            onClear={() => {
              setSearch('');
              setPosSeleccionado('');
              setEstado('todos');
              setFiltroRapido(null);
            }}
            filtroRapido={filtroRapido}
            onFiltroRapido={(k) => setFiltroRapido((cur) => (cur === k ? null : k))}
          />

          <StatsBar total={pos.length} online={onlineCount} offline={offlineCount} />

          <div className="mt-5 flex items-center justify-between">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Mostrando {posFiltrados.length} de {pos.length} dispositivos
            </div>
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
              <button
                type="button"
                onClick={() => setVista('grid')}
                className={[
                  'p-2 text-sm',
                  vista === 'grid' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800',
                ].join(' ')}
                aria-label="Vista grilla"
              >
                <Icon name="grid" className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setVista('list')}
                className={[
                  'p-2 text-sm',
                  vista === 'list' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800',
                ].join(' ')}
                aria-label="Vista lista"
              >
                <Icon name="list" className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            className={[
              'mt-3 grid gap-4',
              vista === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1',
            ].join(' ')}
          >
            {posFiltrados.map((p) => (
              <PosCard key={p.id} pos={p} />
            ))}
            {posFiltrados.length === 0 && (
              <div className="col-span-full text-center text-sm text-slate-500 dark:text-slate-400 py-12">
                No hay dispositivos que coincidan con los filtros.
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
