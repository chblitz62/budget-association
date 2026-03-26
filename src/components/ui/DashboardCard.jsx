import React from 'react';

/**
 * DashboardCard — enveloppe standardisée pour les blocs de contenu.
 * rounded-3xl, bg-white/zinc-900, border, shadow-sm, titre + icône.
 */
export default function DashboardCard({ title, icon, children, darkMode, className = '', action }) {
  return (
    <div className={`rounded-3xl border p-6 transition-all duration-300 ${
      darkMode
        ? 'bg-zinc-900/80 border-zinc-700/30 shadow-[0_4px_20px_rgb(0,0,0,0.15)]'
        : 'bg-white border-slate-100 shadow-sm'
    } ${className}`}>
      {(title || icon) && (
        <div className="flex items-center justify-between mb-5">
          <h2 className={`text-base font-black flex items-center gap-2.5 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            {icon && (
              <span className={`p-1.5 rounded-xl ${darkMode ? 'bg-zinc-800' : 'bg-slate-50'}`}>
                {icon}
              </span>
            )}
            {title}
          </h2>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
