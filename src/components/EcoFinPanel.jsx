import React, { useState, useMemo } from 'react';
import { BookOpen, X, Search, ArrowRight, Lightbulb, Target } from 'lucide-react';
import { GLOSSARY, CATEGORIES, searchGlossary } from '../utils/glossary';

export default function EcoFinPanel({ darkMode, open, onClose }) {
  const [query, setQuery]       = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [filterCat, setFilterCat]   = useState('all');

  const filtered = useMemo(() => {
    let items = searchGlossary(query);
    if (filterCat !== 'all') items = items.filter(g => g.categorie === filterCat);
    return items;
  }, [query, filterCat]);

  const selected = useMemo(() => GLOSSARY.find(g => g.id === selectedId), [selectedId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 no-print">
      <div className={`max-w-5xl w-full max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b ${darkMode ? 'border-zinc-800 bg-zinc-900' : 'border-slate-200 bg-gradient-to-r from-indigo-50 to-violet-50'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${darkMode ? 'bg-indigo-900/40' : 'bg-indigo-100'}`}>
              <BookOpen size={22} className={darkMode ? 'text-indigo-300' : 'text-indigo-600'} />
            </div>
            <div>
              <h2 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Panneau Éco-Fin</h2>
              <p className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Dictionnaire des termes techniques DAF — définition, impact sur le solde, levier d'action</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-xl ${darkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'}`}>
            <X size={20} />
          </button>
        </div>

        {/* Body : 2 colonnes */}
        <div className="flex flex-1 min-h-0">
          {/* Liste gauche */}
          <div className={`w-72 border-r flex flex-col ${darkMode ? 'border-zinc-800 bg-zinc-950' : 'border-slate-200 bg-slate-50'}`}>
            <div className="p-3 space-y-2 shrink-0">
              <div className="relative">
                <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`} />
                <input
                  type="text" placeholder="Rechercher..."
                  value={query} onChange={e => setQuery(e.target.value)}
                  className={`w-full rounded-xl pl-9 pr-3 py-2 text-sm border outline-none ${darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-200'}`}
                />
              </div>
              <select
                value={filterCat} onChange={e => setFilterCat(e.target.value)}
                className={`w-full rounded-xl px-3 py-2 text-xs font-bold border outline-none ${darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-200'}`}
              >
                <option value="all">Toutes les catégories</option>
                {Object.entries(CATEGORIES).map(([id, c]) => (
                  <option key={id} value={id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
              {filtered.map(g => {
                const cat = CATEGORIES[g.categorie];
                const active = selectedId === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setSelectedId(g.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-colors ${active ? (darkMode ? 'bg-indigo-700/40 text-indigo-200' : 'bg-indigo-100 text-indigo-800') : (darkMode ? 'text-zinc-300 hover:bg-zinc-800' : 'text-slate-700 hover:bg-white')}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="flex-1">{g.term}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${darkMode ? `bg-${cat.color}-900/40 text-${cat.color}-300` : `bg-${cat.color}-100 text-${cat.color}-700`}`}>
                        {cat.label}
                      </span>
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <p className={`text-center text-xs py-6 ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Aucun terme correspondant</p>
              )}
            </div>
          </div>

          {/* Détail droite */}
          <div className="flex-1 overflow-y-auto p-6">
            {!selected ? (
              <div className={`flex flex-col items-center justify-center h-full text-center ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                <BookOpen size={48} className="mb-3 opacity-40" />
                <p className="text-sm font-medium">Sélectionnez un terme dans la liste pour afficher sa définition.</p>
                <p className="text-xs mt-2">{GLOSSARY.length} termes disponibles · {Object.keys(CATEGORIES).length} catégories</p>
              </div>
            ) : (
              <div className="max-w-2xl space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {(() => {
                      const cat = CATEGORIES[selected.categorie];
                      return (
                        <span className={`text-xs font-black uppercase tracking-widest px-2 py-1 rounded ${darkMode ? `bg-${cat.color}-900/40 text-${cat.color}-300` : `bg-${cat.color}-100 text-${cat.color}-700`}`}>
                          {cat.label}
                        </span>
                      );
                    })()}
                  </div>
                  <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{selected.term}</h3>
                </div>

                <div className={`rounded-2xl p-5 border ${darkMode ? 'bg-zinc-800/50 border-zinc-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen size={14} className={darkMode ? 'text-zinc-400' : 'text-slate-500'} />
                    <span className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Définition</span>
                  </div>
                  <p className={`text-sm leading-relaxed ${darkMode ? 'text-zinc-200' : 'text-slate-700'}`}>{selected.definition}</p>
                </div>

                <div className={`rounded-2xl p-5 border ${darkMode ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowRight size={14} className={darkMode ? 'text-amber-300' : 'text-amber-600'} />
                    <span className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>Impact sur le solde</span>
                  </div>
                  <p className={`text-sm leading-relaxed ${darkMode ? 'text-amber-100' : 'text-amber-900'}`}>{selected.impact}</p>
                </div>

                <div className={`rounded-2xl p-5 border ${darkMode ? 'bg-emerald-900/20 border-emerald-800' : 'bg-emerald-50 border-emerald-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb size={14} className={darkMode ? 'text-emerald-300' : 'text-emerald-600'} />
                    <span className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>Levier d'action</span>
                  </div>
                  <p className={`text-sm leading-relaxed ${darkMode ? 'text-emerald-100' : 'text-emerald-900'}`}>{selected.levier}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
