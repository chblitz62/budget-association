import React, { useState, useMemo } from 'react';
import {
  Home, BarChart3, Building2, Users, Clock, GraduationCap, UserCheck,
  Landmark, Calculator, Settings, Shield, Layers, ChevronLeft, ChevronRight,
  FileText, Search, X,
} from 'lucide-react';

/**
 * @typedef {{
 *   services: import('../types/index').Service[],
 *   darkMode: boolean,
 *   isOpen: boolean,
 *   onToggle: () => void,
 *   activeTab: string,
 *   onTabChange: (tab: string) => void,
 *   getBudgetService?: (s: import('../types/index').Service) => import('../types/index').BudgetResult,
 * }} SidebarNavProps
 * @param {SidebarNavProps} props
 */
const SidebarNav = ({ services, darkMode, isOpen, onToggle, activeTab, onTabChange, getBudgetService }) => {
  const [search, setSearch] = useState('');

  const groups = [
    {
      label: 'Tableau de bord',
      items: [
        { id: 'dashboard',  label: 'Tableau de bord', icon: Home },
        { id: 'analyse',    label: 'Analyse',          icon: BarChart3 },
      ]
    },
    {
      label: 'Saisie',
      items: [
        { id: 'budget',     label: 'Budget',           icon: Building2 },
        { id: 'rh',         label: 'RH',               icon: Users },
        { id: 'temps',      label: 'Temps de travail', icon: Clock },
        { id: 'formation',  label: 'Formation',        icon: GraduationCap },
        { id: 'vacataires', label: 'Vacataires',       icon: UserCheck },
      ]
    },
    {
      label: 'Pilotage',
      items: [
        { id: 'subvention', label: 'Subvention',       icon: Landmark },
        { id: 'daf',        label: 'DAF',              icon: Calculator },
        { id: 'parametres', label: 'Paramètres',       icon: Settings },
      ]
    },
    {
      label: 'Commerce',
      items: [
        { id: 'devis',      label: 'Devis formation',        icon: FileText },
      ]
    },
    {
      label: 'Audit',
      items: [
        { id: 'reporting',  label: 'Reporting réglementaire', icon: Shield },
      ]
    },
  ];

  const filteredServices = useMemo(() => {
    if (!search.trim()) return services;
    const q = search.toLowerCase();
    return services.filter(s => s.nom?.toLowerCase().includes(q));
  }, [services, search]);

  const budgets = useMemo(() => {
    if (!getBudgetService) return {};
    const map = {};
    for (const s of services) {
      try { map[s.id] = getBudgetService(s); } catch { map[s.id] = null; }
    }
    return map;
  }, [services, getBudgetService]);

  return (
    <div className={`sidebar-container fixed left-0 z-40 transition-all duration-300 no-print ${isOpen ? 'w-64' : 'w-14'}`}
         style={{ top: '64px', height: 'calc(100vh - 64px)' }}>
      <div className={`h-full flex flex-col border-r ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-200'} shadow-xl`}>

        <button
          onClick={onToggle}
          className={`absolute -right-3 top-6 w-6 h-6 rounded-full shadow-lg flex items-center justify-center border z-10
            ${darkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
        >
          {isOpen ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
        </button>

        <nav className="flex-1 overflow-y-auto sidebar-nav py-3 px-2">
          {groups.map(group => (
            <div key={group.label} className="mb-3">
              {isOpen && (
                <div className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 ${darkMode ? 'text-zinc-600' : 'text-slate-400'}`}>
                  {group.label}
                </div>
              )}
              {group.items.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    title={!isOpen ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-all duration-150 ${
                      isActive
                        ? darkMode
                          ? 'bg-indigo-600/20 text-indigo-400'
                          : 'bg-indigo-50 text-indigo-700'
                        : darkMode
                          ? 'text-zinc-500 hover:bg-zinc-800/80 hover:text-zinc-200'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    <item.icon size={16} className={`flex-shrink-0 ${isActive ? 'text-indigo-500' : ''}`} />
                    {isOpen && (
                      <span className={`text-xs font-semibold truncate ${isActive ? 'font-bold' : ''}`}>
                        {item.label}
                      </span>
                    )}
                    {isActive && isOpen && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
              {!isOpen && <div className={`mx-3 my-1.5 h-px ${darkMode ? 'bg-zinc-800' : 'bg-slate-100'}`} />}
            </div>
          ))}

          {isOpen && services.length > 0 && (
            <div className="mb-3">
              <div className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 ${darkMode ? 'text-zinc-600' : 'text-slate-400'}`}>
                Services ({services.length})
              </div>

              {/* UX.5 — Recherche services */}
              {services.length > 4 && (
                <div className={`relative mx-1 mb-2`}>
                  <Search size={11} className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${darkMode ? 'text-zinc-600' : 'text-slate-400'}`} />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher…"
                    className={`w-full pl-7 pr-6 py-1.5 text-[11px] rounded-lg border outline-none ${darkMode ? 'bg-zinc-900 border-zinc-700 text-zinc-300 placeholder-zinc-600' : 'bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400'}`}
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className={`absolute right-2 top-1/2 -translate-y-1/2 ${darkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-400 hover:text-slate-600'}`}>
                      <X size={10} />
                    </button>
                  )}
                </div>
              )}

              {filteredServices.map(srv => {
                const b = budgets[srv.id];
                const solde = b ? (b.recettes - b.total) : null;
                const soldePositif = solde !== null && solde >= 0;
                const soldeLabel = solde !== null
                  ? `${solde >= 0 ? '+' : ''}${Math.round(solde / 1000)}k€`
                  : null;

                return (
                  <button
                    key={srv.id}
                    onClick={() => {
                      onTabChange('budget');
                      setTimeout(() => {
                        const el = document.getElementById(`service-${srv.id}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 100);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl mb-0.5 transition-all duration-150 ${
                      darkMode ? 'text-zinc-500 hover:bg-zinc-800/80 hover:text-zinc-300' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                  >
                    {srv.promos
                      ? <GraduationCap size={13} className="text-violet-400 flex-shrink-0" />
                      : <Layers size={13} className="text-indigo-400 flex-shrink-0" />
                    }
                    <span className="text-xs truncate flex-1 text-left">{srv.nom}</span>
                    {/* UX.4 — Badge solde */}
                    {soldeLabel && (
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                        soldePositif
                          ? darkMode ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                          : darkMode ? 'bg-red-900/50 text-red-400'     : 'bg-red-50 text-red-600'
                      }`}>
                        {soldeLabel}
                      </span>
                    )}
                  </button>
                );
              })}

              {filteredServices.length === 0 && search && (
                <p className={`text-[10px] text-center py-2 px-3 ${darkMode ? 'text-zinc-600' : 'text-slate-400'}`}>
                  Aucun service trouvé
                </p>
              )}
            </div>
          )}
        </nav>

        <div className={`p-3 border-t ${darkMode ? 'border-zinc-800' : 'border-slate-100'}`}>
          {isOpen ? (
            <div className={`text-[10px] font-medium ${darkMode ? 'text-zinc-600' : 'text-slate-400'}`}>
              {services.length} service{services.length !== 1 ? 's' : ''}
            </div>
          ) : (
            <div className="flex justify-center">
              <Layers size={14} className={darkMode ? 'text-zinc-700' : 'text-slate-300'} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SidebarNav;
