import Icon from './Icon.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Header() {
  const { theme, toggle } = useTheme();
  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur sticky top-0 z-20">
      <div className="md:hidden flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center text-white font-bold">
          D
        </div>
        <span className="font-semibold">DPSDESK</span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2 md:gap-3">
        <button
          type="button"
          className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Notificaciones"
        >
          <Icon name="bell" className="w-5 h-5" />
          <span className="absolute top-1 right-1 inline-flex items-center justify-center text-[10px] font-bold w-4 h-4 rounded-full bg-rose-500 text-white">
            3
          </span>
        </button>

        <button
          type="button"
          onClick={toggle}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Cambiar tema"
          title={theme === 'dark' ? 'Cambiar a claro' : 'Cambiar a oscuro'}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-3 pl-3 ml-1 border-l border-slate-200 dark:border-slate-800">
          <div className="text-right leading-tight">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">diego</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">d.munozzapata99@gmail.com</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-violet-500 text-white flex items-center justify-center font-semibold">
            D
          </div>
        </div>
      </div>
    </header>
  );
}
