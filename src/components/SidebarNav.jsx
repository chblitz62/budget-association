import React, { useState, useMemo } from 'react';
import {
  Home, BarChart3, Building2, Users, Clock, GraduationCap, UserCheck,
  Landmark, Calculator, Settings, Shield, Layers, ChevronLeft, ChevronRight,
  FileText, Search, X, Compass, Sparkles, BookOpen, Wand2,
} from 'lucide-react';
import { surface } from '../styles/tokens';

/**
 * @typedef {{
 *   services: import('../types/index').Service[],
 *   darkMode: boolean,
 *   isOpen: boolean,
 *   onToggle: () => void,
 *   activeTab: string,
 *   onTabChange: (tab: string) => void,
 *   getBudgetService?: (s: import('../types/index').Service) => import('../types/index').BudgetResult,
 *   onShowWizardSetup?: () => void,
 *   onShowWizardBP?: () => void,
 *   onShowEcoFin?: () => void,
 *   onShowAICopilot?: () => void,
 * }} SidebarNavProps
 * @param {SidebarNavProps} props
 */
const SidebarNav = ({
  services, darkMode, isOpen, onToggle, activeTab, onTabChange, getBudgetService,
  onShowWizardSetup, onShowWizardBP, onShowEcoFin, onShowAICopilot,
}) => {
  const [search, setSearch] = useState('');

  // ── Section "Premiers pas" (Mode Novice) — affichée si callbacks fournis
  const onboardingActions = [
    onShowWizardSetup && {
      key: 'wizard_setup',
      label: 'Assistant de configuration',
      hint: 'Premier paramétrage pas à pas',
      icon: Wand2,
      accent: 'text-violet-500',
      onClick: onShowWizardSetup,
    },
    onShowWizardBP && {
      key: 'wizard_bp',
      label: 'Importer un budget',
      hint: 'Depuis un fichier Excel BP',
      icon: Compass,
      accent: 'text-amber-500',
      onClick: onShowWizardBP,
    },
    onShowEcoFin && {
      key: 'ecofin',
      label: 'Glossaire financier',
      hint: '12 termes expliqués (BFR, ETP…)',
      icon: BookOpen,
      accent: 'text-indigo-500',
      onClick: onShowEcoFin,
    },
    onShowAICopilot && {
      key: 'ai',
      label: 'Copilote IA',
      hint: 'Analyse stratégique guidée',
      icon: Sparkles,
      accent: 'text-fuchsia-500',
      onClick: onShowAICopilot,
    },
  ].filter(Boolean);

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
      <div className={`h-full flex flex-col ${surface.sidebar(darkMode)}`}>

        <button
          onClick={onToggle}
          aria-label={isOpen ? 'Replier la barre latérale' : 'Déplier la barre latérale'}
          className={`absolute -right-3 top-6 w-6 h-6 rounded-full shadow-lg flex items-center justify-center border z-10 transition-colors
            ${darkMode ? 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
        >
          {isOpen ? <ChevronLeft size={13} strokeWidth={1.5} /> : <ChevronRight size={13} strokeWidth={1.5} />}
        </button>

        <nav className="flex-1 overflow-y-auto sidebar-nav py-3 px-2">
          {/* ── Section "Premiers pas" (Mode Novice) ── */}
          {onboardingActions.length > 0 && (
            <div className="mb-3">
              {isOpen ? (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 ${darkMode ? 'text-violet-400' : 'text-violet-600'}`}>
                  <Sparkles size={11} strokeWidth={1.5} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Premiers pas</span>
                </div>
              ) : null}
              {onboardingActions.map(action => (
                <button
                  key={action.key}
                  onClick={action.onClick}
                  title={!isOpen ? action.label : undefined}
                  className={`w-full flex items-start gap-3 px-3 py-2 rounded-xl mb-0.5 transition-all duration-150 text-left group
                    ${darkMode ? 'hover:bg-zinc-800/60' : 'hover:bg-slate-50'}`}
                >
                  <action.icon size={16} strokeWidth={1.5} className={`flex-shrink-0 mt-0.5 ${action.accent}`} />
                  {isOpen && (
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-semibold leading-tight ${darkMode ? 'text-zinc-200' : 'text-slate-800'}`}>
                        {action.label}
                      </div>
                      <div className={`text-[10px] mt-0.5 leading-snug ${darkMode ? 'text-zinc-500' : 'text-slate-500'}`}>
                        {action.hint}
                      </div>
                    </div>
                  )}
                </button>
              ))}
              <div className={`mx-3 my-2 h-px ${darkMode ? 'bg-zinc-800/60' : 'bg-slate-200/60'}`} />
            </div>
          )}

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
                    <item.icon size={16} strokeWidth={1.5} className={`flex-shrink-0 ${isActive ? 'text-indigo-500' : ''}`} />
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
                      ? <GraduationCap size={13} strokeWidth={1.5} className="text-violet-400 flex-shrink-0" />
                      : <Layers size={13} strokeWidth={1.5} className="text-indigo-400 flex-shrink-0" />
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
