import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [connected, setConnected] = useState(false);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const cfg = window.__DPSDESK_CONFIG__;
    setConfig(cfg);
    if (cfg?.backendUrl) {
      fetch(`${cfg.backendUrl}/api/health`)
        .then(r => r.ok && setConnected(true))
        .catch(() => setConnected(false));
      const interval = setInterval(() => {
        fetch(`${cfg.backendUrl}/api/health`)
          .then(r => r.ok && setConnected(true))
          .catch(() => setConnected(false));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <div className="flex h-full min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-1 min-h-0 min-w-0">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Footer bar "por abajo" */}
      <footer className="h-12 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className="text-slate-600 dark:text-slate-400">
            {connected ? 'Conectado' : 'Desconectado'}
            {config?.posId && ` • ${config.posId.slice(0, 8)}...`}
          </span>
        </div>
        <button
          onClick={() => navigate('/settings')}
          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          title="Configuración"
        >
          ⚙️
        </button>
      </footer>
    </div>
  );
}
