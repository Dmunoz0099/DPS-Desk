// Hero superior con gradiente — equivalente al banner "Monitoreo de Dispositivos"
export default function PageHero({ title, subtitle, badge, right }) {
  return (
    <section className="rounded-2xl overflow-hidden mb-6 shadow-sm">
      <div className="relative bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-8 md:px-10 md:py-10 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm md:text-base text-white/85 mt-1">{subtitle}</p>}
            {badge && (
              <div className="mt-3 inline-flex items-center gap-2 text-xs bg-white/15 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                {badge}
              </div>
            )}
          </div>
          {right && <div className="text-sm text-white/85">{right}</div>}
        </div>
      </div>
    </section>
  );
}
