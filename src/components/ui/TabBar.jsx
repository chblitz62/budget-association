import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, MoreHorizontal, Wand2 } from 'lucide-react';
import { surface } from '../../styles/tokens';

/**
 * <TabBar /> — Barre d'onglets avec Progressive Disclosure (Mode Novice).
 *
 * Mode "essentiel" (défaut novice) :
 *   - Affiche uniquement les onglets marqués comme essentiels
 *   - Un bouton "Plus" ouvre un menu avec tous les autres
 *   - Si l'onglet actif n'est PAS essentiel → on l'inclut quand même pour ne pas
 *     perdre l'utilisateur (et un badge "+" indique qu'il y en a d'autres)
 *
 * Mode "expert" :
 *   - Affiche tous les onglets en flat (comportement historique)
 *
 * Props :
 *   - tabs              : Array<{ id, label, icon: ReactNode, essential?: boolean }>
 *   - activeTab         : string
 *   - onChange          : (tabId) => void
 *   - expertMode        : boolean — toggle global (depuis globalParams.expertMode)
 *   - onToggleExpertMode: () => void — bascule essentiel/expert (optionnel ; sinon bouton caché)
 *   - darkMode          : boolean
 */
export default function TabBar({
  tabs = [],
  activeTab,
  onChange,
  expertMode = false,
  onToggleExpertMode,
  darkMode = false,
  className = '',
}) {
  const [showMore, setShowMore] = useState(false);
  const moreRef = useRef(null);

  useEffect(() => {
    if (!showMore) return;
    const handleClick = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setShowMore(false);
    };
    const handleEsc = (e) => { if (e.key === 'Escape') setShowMore(false); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showMore]);

  const dm = darkMode;
  const essentialTabs = tabs.filter(t => t.essential);
  const otherTabs = tabs.filter(t => !t.essential);

  // En mode novice, tabs visibles = essentiels + (actif s'il n'est pas essentiel)
  const activeIsEssential = essentialTabs.some(t => t.id === activeTab);
  const visibleTabs = expertMode
    ? tabs
    : (activeIsEssential
        ? essentialTabs
        : [...essentialTabs, tabs.find(t => t.id === activeTab)].filter(Boolean));

  const hiddenCount = expertMode ? 0 : (otherTabs.length - (activeIsEssential ? 0 : 1));

  const tabBtnCls = (isActive) => `flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 whitespace-nowrap ${
    isActive
      ? dm ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30' : 'bg-white text-indigo-700 shadow-sm shadow-indigo-100'
      : dm ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60' : 'text-slate-500 hover:text-slate-800 hover:bg-white/70'
  }`;

  return (
    <div className={`mb-8 p-1.5 rounded-2xl no-print backdrop-blur-md border transition-all duration-500 ${dm ? 'bg-zinc-900/70 border-zinc-700/40' : 'bg-slate-100/90 border-slate-200/60'} ${className}`}>
      <div className="flex gap-1 overflow-x-auto scrollbar-none items-center">
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange?.(tab.id)}
            className={tabBtnCls(activeTab === tab.id)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            {tab.icon} {tab.label}
          </button>
        ))}

        {/* Bouton "Plus" (mode novice uniquement) */}
        {!expertMode && hiddenCount > 0 && (
          <div ref={moreRef} className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowMore(v => !v)}
              aria-haspopup="menu"
              aria-expanded={showMore}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                dm
                  ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/70'
              } ${showMore ? (dm ? 'bg-zinc-800/60 text-zinc-100' : 'bg-white/70 text-slate-800') : ''}`}
            >
              <MoreHorizontal size={14} strokeWidth={1.5} />
              <span>Plus</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${dm ? 'bg-indigo-900/40 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                +{hiddenCount}
              </span>
              <ChevronDown size={12} strokeWidth={1.5} className={`transition-transform ${showMore ? 'rotate-180' : ''}`} />
            </button>

            {showMore && (
              <div role="menu" className={`absolute right-0 top-full mt-2 w-64 ${surface.elevated(dm)} p-2 z-[60] animate-zoom-in origin-top-right`}>
                <div className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
                  Autres modules
                </div>
                {otherTabs.map(tab => (
                  <button
                    key={tab.id}
                    role="menuitem"
                    onClick={() => { onChange?.(tab.id); setShowMore(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-colors text-left text-xs font-semibold
                      ${activeTab === tab.id
                        ? (dm ? 'bg-indigo-600/20 text-indigo-300' : 'bg-indigo-50 text-indigo-700')
                        : (dm ? 'text-zinc-300 hover:bg-zinc-800/60' : 'text-slate-700 hover:bg-slate-50')}`}
                  >
                    <span className={activeTab === tab.id ? 'text-indigo-500' : ''}>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
                {onToggleExpertMode && (
                  <>
                    <div className={`my-1 h-px ${dm ? 'bg-zinc-800' : 'bg-slate-100'}`} />
                    <button
                      onClick={() => { onToggleExpertMode(); setShowMore(false); }}
                      className={`w-full flex items-start gap-2 px-3 py-2 rounded-xl transition-colors text-left
                        ${dm ? 'hover:bg-zinc-800/60' : 'hover:bg-slate-50'}`}
                    >
                      <Wand2 size={14} strokeWidth={1.5} className={dm ? 'mt-0.5 text-violet-400' : 'mt-0.5 text-violet-600'} />
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-bold ${dm ? 'text-zinc-100' : 'text-slate-800'}`}>
                          Activer le mode expert
                        </div>
                        <div className={`text-[10px] mt-0.5 ${dm ? 'text-zinc-500' : 'text-slate-500'}`}>
                          Tous les onglets toujours visibles
                        </div>
                      </div>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Bouton retour mode novice (en mode expert) */}
        {expertMode && onToggleExpertMode && (
          <button
            type="button"
            onClick={onToggleExpertMode}
            className={`flex-shrink-0 ml-auto flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-semibold transition-colors ${
              dm ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60' : 'text-slate-500 hover:text-slate-700 hover:bg-white/70'
            }`}
            title="Revenir au mode essentiel (3 onglets clés)"
          >
            <Wand2 size={12} strokeWidth={1.5} />
            <span className="hidden sm:inline">Mode essentiel</span>
          </button>
        )}
      </div>
    </div>
  );
}
